import { EventEmitter } from 'eventemitter3'
import { Duplex, PassThrough, Readable } from 'stream'
import { WebSocket } from 'ws'
import type { Agent } from './agent'
import { pcm16ToFloat32 } from './audio'
import { Logger } from './Logger'
import type { STT } from './stt'
import type { TTS } from './tts'
import {
  MicdropCallSummary,
  MicdropClientCommands,
  MicdropConversationItem,
  MicdropServerCommands,
  TurnDetector,
} from './types'

/** Rate the client records at, and sends its chunks in */
const USER_SAMPLE_RATE = 16000

/**
 * How long an answer waits once the detector asked for the rest of a sentence.
 *
 * The way out of a wrong verdict: a speaker who never comes back still gets an
 * answer instead of a call that goes quiet.
 */
const DEFAULT_TURN_MAX_WAIT = 4000 // ms

export interface MicdropServerEvents {
  End: [MicdropCallSummary]
  UserAudio: [Buffer]
  AssistantAudio: [Buffer]
}

export interface MicdropConfig {
  firstMessage?: string
  generateFirstMessage?: boolean
  agent: Agent
  stt: STT
  tts: TTS

  /**
   * Waits for the rest of the sentence when the speaker paused in the middle
   * of one, instead of answering an unfinished question.
   *
   * Prefer running the detector in the client, which reaches the same decision
   * without the round trip and can then close its turns sooner. This is the
   * option for the browsers where the model has nowhere to run.
   */
  turnDetector?: TurnDetector

  /** How long to wait for the rest of a sentence, 4000 ms by default */
  turnMaxWait?: number
}

export class MicdropServer extends EventEmitter<MicdropServerEvents> {
  public socket: WebSocket | null = null
  public config: MicdropConfig | null = null
  public logger?: Logger

  private startTime = Date.now()
  private lastMessageSpeeched?: MicdropConversationItem

  // Queue system for operations
  private operationQueue: Array<() => Promise<void>> = []
  private isProcessingQueue = false

  // When user is speaking, we're streaming chunks for STT
  private currentUserStream?: Duplex
  private userSpeechChunks = 0
  // Asked as soon as the speaker pauses, so it weighs that stretch of audio
  // and not the next one
  private turnComplete?: Promise<boolean>
  private heldTurnTimer?: ReturnType<typeof setTimeout>

  constructor(socket: WebSocket, config: MicdropConfig) {
    super()
    this.socket = socket
    this.config = config
    this.log(`Call started`)

    // Setup STT
    this.config.stt.on('Transcript', this.onTranscriptSTT)

    // Setup TTS
    this.config.tts.on('Audio', this.onAudioTTS)

    // Setup agent
    this.config.agent.on('Message', (message) =>
      this.socket?.send(
        `${MicdropServerCommands.Message} ${JSON.stringify(message)}`
      )
    )
    this.config.agent.on('CancelLastUserMessage', () =>
      this.socket?.send(MicdropServerCommands.CancelLastUserMessage)
    )
    this.config.agent.on('SkipAnswer', () =>
      this.socket?.send(MicdropServerCommands.SkipAnswer)
    )
    this.config.agent.on('EndCall', () =>
      this.socket?.send(MicdropServerCommands.EndCall)
    )
    this.config.agent.on('ToolCall', (toolCall) =>
      this.socket?.send(
        `${MicdropServerCommands.ToolCall} ${JSON.stringify(toolCall)}`
      )
    )

    // Assistant speaks first
    // Deferred so consumers (e.g. MicdropRecorder) can subscribe to agent
    // events before the first message is added to the conversation.
    queueMicrotask(() => this.sendFirstMessage())

    // Listen to events
    socket.on('close', this.onClose)
    socket.on('message', this.onMessage)
  }

  private log(...message: any[]) {
    this.logger?.log(...message)
  }

  private async processQueue() {
    if (this.isProcessingQueue || this.operationQueue.length === 0) return

    this.isProcessingQueue = true

    while (this.operationQueue.length > 0) {
      const operation = this.operationQueue.shift()
      if (operation) {
        try {
          await operation()
        } catch (error) {
          this.log('Error processing queued operation:', error)
        }
      }
    }

    this.isProcessingQueue = false
  }

  private queueOperation(operation: () => Promise<void>) {
    this.operationQueue.push(operation)
    this.processQueue()
  }

  public cancel() {
    this.config?.tts.cancel()
    this.config?.agent.cancel()
    // Clear the queue
    this.operationQueue = []
  }

  private onClose = () => {
    this.releaseHeldTurn()
    if (!this.config) return
    this.log('Connection closed')
    const duration = Math.round((Date.now() - this.startTime) / 1000)

    // Destroy instances
    this.config.agent.destroy()
    this.config.stt.destroy()
    this.config.tts.destroy()

    // Emit End event
    this.emit('End', {
      conversation: this.config.agent.conversation,
      duration,
    })

    // Unset params
    this.socket = null
    this.config = null
  }

  private onMessage = async (message: Buffer) => {
    if (message.byteLength === 0) return
    if (!Buffer.isBuffer(message)) {
      this.log('Message is not a buffer')
      return
    }

    // Commands
    if (message.byteLength < 15) {
      const cmd = message.toString()
      this.log(`Command: ${cmd}`)

      if (cmd === MicdropClientCommands.StartSpeaking) {
        // User started speaking
        this.onStartSpeaking()
      } else if (cmd === MicdropClientCommands.Mute) {
        // User muted the call
        this.onMute()
      } else if (cmd === MicdropClientCommands.StopSpeaking) {
        // User stopped speaking
        this.onStopSpeaking()
      }
    }

    // Audio chunk
    else if (this.currentUserStream) {
      this.onUserAudio(message)
    }
  }

  private onUserAudio(chunk: Buffer) {
    this.log(`Received chunk (${chunk.byteLength} bytes)`)
    this.currentUserStream?.write(chunk)
    this.userSpeechChunks++
    this.config?.turnDetector?.push(pcm16ToFloat32(chunk), USER_SAMPLE_RATE)
    this.emit('UserAudio', chunk)
  }

  private onMute() {
    this.userSpeechChunks = 0
    this.currentUserStream?.end()
    this.currentUserStream = undefined
    this.cancel()
  }

  private onStartSpeaking() {
    if (!this.config) return
    this.userSpeechChunks = 0
    this.currentUserStream?.end()
    this.currentUserStream = new PassThrough()
    this.config.turnDetector?.reset()
    this.turnComplete = undefined
    // The rest of the sentence is arriving, so the deadline can go
    this.releaseHeldTurn()
    this.config.stt.transcribe(this.currentUserStream)
    this.cancel()
  }

  private onStopSpeaking() {
    const hasNoUserSpeech =
      !this.currentUserStream || this.userSpeechChunks === 0
    this.currentUserStream?.end()
    this.currentUserStream = undefined
    this.userSpeechChunks = 0

    // If user is not speaking or no chunks were received, skip
    if (hasNoUserSpeech) {
      this.socket?.send(MicdropServerCommands.SkipAnswer)
      return
    }

    // Weigh the stretch of audio that just ended, before the next one starts
    this.turnComplete = this.predictTurnComplete()

    const conversation = this.config?.agent.conversation
    const lastMessage = conversation?.[conversation.length - 1]
    if (
      lastMessage?.role === 'user' &&
      this.lastMessageSpeeched !== lastMessage
    ) {
      this.log(
        'User stopped speaking and a transcript already exists, answering'
      )
      this.answerUserTurn()
    }
  }

  private async predictTurnComplete(): Promise<boolean> {
    const detector = this.config?.turnDetector
    if (!detector) return true
    try {
      const { complete } = await detector.predict()
      this.log(`Turn sounds ${complete ? 'finished' : 'unfinished'}`)
      return complete
    } catch (error) {
      this.log(`Turn detection failed: ${error}`)
      return true
    }
  }

  /** Answers, unless the sentence sounds like it has more coming */
  private async answerUserTurn() {
    const complete = await (this.turnComplete ?? Promise.resolve(true))
    if (!complete) {
      this.log('Waiting for the rest of the sentence')
      this.socket?.send(MicdropServerCommands.SkipAnswer)
      this.holdTurn()
      return
    }
    this.releaseHeldTurn()
    this.cancel()
    this.answer()
  }

  /**
   * Answers anyway if the rest of the sentence never comes.
   *
   * Without it, a detector that hears an unfinished sentence where there is
   * none leaves the call silent for good.
   */
  private holdTurn() {
    this.releaseHeldTurn()
    this.heldTurnTimer = setTimeout(() => {
      this.heldTurnTimer = undefined
      this.log('Nothing more came, answering')
      this.cancel()
      this.answer()
    }, this.config?.turnMaxWait ?? DEFAULT_TURN_MAX_WAIT)
  }

  private releaseHeldTurn() {
    if (!this.heldTurnTimer) return
    clearTimeout(this.heldTurnTimer)
    this.heldTurnTimer = undefined
  }

  private onTranscriptSTT = async (transcript: string) => {
    if (!this.config) return

    // Skip answer if transcript is empty
    if (transcript === '') {
      this.socket?.send(MicdropServerCommands.SkipAnswer)
      return
    }

    this.log(`User transcript: "${transcript}"`)
    this.config.agent.addUserMessage(transcript)

    // Answer if user stopped speaking
    if (!this.currentUserStream) {
      this.log('User stopped speaking, answering')
      this.answerUserTurn()
    }
  }

  private onAudioTTS = (audio: Buffer) => {
    if (!this.socket) return
    this.log(`Send audio chunk (${audio.byteLength} bytes)`)
    this.socket.send(audio)
    this.emit('AssistantAudio', audio)
  }

  private sendFirstMessage() {
    if (!this.config) return
    if (this.config.firstMessage) {
      // Send first message
      this.config.agent.addAssistantMessage(this.config.firstMessage)
      this.speak(this.config.firstMessage)
    } else if (this.config.generateFirstMessage) {
      // Generate first message
      this.answer()
    } else {
      // Skip answer if no first message is provided
      // to avoid keeping the client in a processing state
      this.socket?.send(MicdropServerCommands.SkipAnswer)
    }
  }

  public answer() {
    this.queueOperation(async () => {
      await this._answer()
    })
  }

  private async _answer() {
    if (!this.config) return

    // Prevent answering twice
    const lastMessage =
      this.config.agent.conversation[this.config.agent.conversation.length - 1]
    if (this.lastMessageSpeeched === lastMessage) {
      this.log('Already answered, skipping')
      return
    }
    this.lastMessageSpeeched = lastMessage

    try {
      // LLM: Generate answer
      const stream = this.config.agent.answer()

      // TTS: Generate answer audio, unless there is nothing to say.
      //
      // An answer can be skipped after the fact: a tool with skipAnswer, or an
      // onBeforeAnswer hook returning true, ends the stream without a word in
      // it. Handing that empty stream to the TTS opens a synthesis request for
      // nothing, and a provider that stamps each request (Gradium multiplexes
      // this way) then drops the audio of the sentence still playing, so a
      // skipped answer cuts the assistant off mid-word.
      if (await hasContent(stream)) {
        await this._speak(stream)
      }
    } catch (error) {
      this.socket?.send(MicdropServerCommands.SkipAnswer)
      throw error
    }
  }

  // Run text-to-speech and send to client
  public speak(message: string | Readable) {
    this.queueOperation(async () => {
      await this._speak(message)
    })
  }

  private async _speak(message: string | Readable) {
    if (!this.socket || !this.config) return

    // Convert message to stream if needed
    let textStream: Readable
    if (typeof message === 'string') {
      const stream = new PassThrough()
      stream.write(message)
      stream.end()
      textStream = stream
    } else {
      textStream = message
    }

    // Run TTS
    this.config.tts.speak(textStream)
  }
}

/**
 * Resolves true as soon as the stream holds something to read, false if it ends
 * without ever carrying anything.
 *
 * The chunk read to find out is put back, so the consumer that follows sees the
 * whole stream from its first byte.
 */
function hasContent(stream: Readable): Promise<boolean> {
  return new Promise((resolve) => {
    const onReadable = () => {
      const chunk = stream.read()
      if (chunk === null) return
      stream.unshift(chunk)
      done(true)
    }
    const onEnd = () => done(false)
    const done = (result: boolean) => {
      stream.off('readable', onReadable)
      stream.off('end', onEnd)
      resolve(result)
    }
    stream.on('readable', onReadable)
    stream.on('end', onEnd)
  })
}
