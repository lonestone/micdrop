import { Duplex, PassThrough, Readable } from 'stream'
import { WebSocket } from 'ws'
import { Logger } from './Logger'
import {
  MicdropClientCommands,
  MicdropConfig,
  MicdropServerCommands,
} from './types'

interface Processing {
  aborted: boolean
}

export class MicdropServer {
  public socket: WebSocket | null = null
  public config: MicdropConfig | null = null
  public logger?: Logger

  private startTime = Date.now()

  // An answer can be aborted if user is speaking
  private processing?: Processing

  // When user is speaking, we're streaming chunks for STT
  private currentUserStream?: Duplex

  // Enable speaker streaming
  private speakerStreamingEnabled = false

  constructor(socket: WebSocket, config: MicdropConfig) {
    this.socket = socket
    this.config = config
    this.log(`Call started`)

    // Setup STT
    this.config.stt.on('Transcript', this.onTranscript.bind(this))

    // Setup agent
    this.config.agent.on('Message', (message) =>
      this.socket?.send(
        `${MicdropServerCommands.Message} ${JSON.stringify(message)}`
      )
    )
    this.config.agent.on('CancelLastUserMessage', () =>
      this.socket?.send(MicdropServerCommands.CancelLastUserMessage)
    )
    this.config.agent.on('CancelLastAssistantMessage', () =>
      this.socket?.send(MicdropServerCommands.CancelLastAssistantMessage)
    )
    this.config.agent.on('SkipAnswer', () =>
      this.socket?.send(MicdropServerCommands.SkipAnswer)
    )
    this.config.agent.on('EndCall', () =>
      this.socket?.send(MicdropServerCommands.EndCall)
    )

    // Assistant speaks first
    if (config.firstMessage) {
      this.config.agent.addAssistantMessage(config.firstMessage)
      this.speak(config.firstMessage)
    } else if (config.generateFirstMessage) {
      const answerStream = this.config.agent.answer()
      this.speak(answerStream)
    }

    // Listen to events
    socket.on('close', this.onClose.bind(this))
    socket.on('message', this.onMessage.bind(this))
  }

  private log(...message: any[]) {
    this.logger?.log(...message)
  }

  private createProcessing(): Processing {
    if (this.processing) {
      this.abortProcessing()
    }
    this.processing = { aborted: false }
    return this.processing
  }

  private abortProcessing() {
    if (!this.processing) return
    if (!this.processing.aborted) {
      this.config?.tts.cancel()
      this.config?.agent.cancel()
      this.processing.aborted = true
    }
    this.processing = undefined
  }

  private async sendAudio(
    audio: ArrayBuffer | Readable,
    processing: Processing
  ) {
    if (!this.socket) return

    // Remove last assistant message if aborted
    const onAbort = () => {
      this.log('Answer aborted, stop TTS')
      this.config?.tts.cancel()
    }

    if (processing.aborted) {
      onAbort?.()
      return
    }

    if (Buffer.isBuffer(audio) || audio instanceof ArrayBuffer) {
      // Whole audio as a single buffer
      this.log(`Send audio: (${audio.byteLength} bytes)`)
      this.socket.send(audio)
    } else if (audio.readable) {
      // Enable speaker streaming if not already enabled
      if (!this.speakerStreamingEnabled) {
        this.socket.send(MicdropServerCommands.EnableSpeakerStreaming)
        this.speakerStreamingEnabled = true
      }

      // Audio as a stream
      for await (const chunk of audio) {
        if (processing.aborted) {
          onAbort?.()
          return
        }
        this.log(`Send audio chunk (${chunk.length} bytes)`)
        this.socket.send(chunk)
      }
    } else {
      this.log(`Unknown audio type: ${JSON.stringify(audio)}`)
    }
  }

  private onClose() {
    if (!this.config) return
    this.log('Connection closed')
    this.abortProcessing()
    const duration = Math.round((Date.now() - this.startTime) / 1000)

    // Destroy instances
    this.config.agent.destroy()
    this.config.stt.destroy()
    this.config.tts.destroy()

    // End call callback
    this.config.onEnd?.({
      conversation: this.config.agent.conversation.slice(1), // Remove system message
      duration,
    })

    // Unset params
    this.socket = null
    this.config = null
  }

  private async onMessage(message: Buffer) {
    if (!Buffer.isBuffer(message)) {
      console.warn(`[MicdropServer] Message is not a buffer`)
      return
    }

    // Commands
    if (message.byteLength < 15) {
      const cmd = message.toString()
      this.log(`Command: ${cmd}`)

      if (cmd === MicdropClientCommands.StartSpeaking) {
        // User started speaking
        await this.onStartSpeaking()
      } else if (cmd === MicdropClientCommands.Mute) {
        // User muted the call
        await this.onMute()
      } else if (cmd === MicdropClientCommands.StopSpeaking) {
        // User stopped speaking
        await this.onStopSpeaking()
      }
    }

    // Audio chunk
    else if (Buffer.isBuffer(message) && this.currentUserStream) {
      this.log(`Received chunk (${message.byteLength} bytes)`)
      this.currentUserStream.write(message)
    }
  }

  private async onMute() {
    this.currentUserStream?.end()
    this.currentUserStream = undefined
    this.abortProcessing()
  }

  private async onStartSpeaking() {
    if (!this.config) return
    this.currentUserStream?.end()
    this.currentUserStream = new PassThrough()
    this.config.stt.transcribe(this.currentUserStream)
    this.abortProcessing()
  }

  private async onStopSpeaking() {
    this.currentUserStream?.end()
    this.currentUserStream = undefined
    this.abortProcessing()
  }

  private async onTranscript(transcript: string) {
    if (!this.config) return
    const processing = this.createProcessing()
    this.log('User transcript:', transcript)

    try {
      // Add user message to conversation
      this.config.agent.addUserMessage(transcript)

      // LLM: Generate answer
      const answerStream = this.config.agent.answer()
      if (processing.aborted) {
        this.log('Answer aborted, ignoring answer')
        return
      }

      await this.speak(answerStream, processing)
    } catch (error) {
      console.error('[MicdropServer]', error)
      this.socket?.send(MicdropServerCommands.SkipAnswer)
    }
  }

  // Run text-to-speech and send to client
  private async speak(message: string | Readable, processing?: Processing) {
    if (!this.socket || !this.config) return
    if (!processing) {
      processing = this.createProcessing()
    }

    // TTS: Generate answer audio
    try {
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
      const audio = this.config.tts.speak(textStream)

      // Send audio to client
      await this.sendAudio(audio, processing)
    } catch (error) {
      console.error('[MicdropServer]', error)
      this.socket?.send(MicdropServerCommands.SkipAnswer)
    }
  }
}
