import { Duplex, PassThrough, Readable } from 'stream'
import { WebSocket } from 'ws'
import { Logger } from './Logger'
import {
  MicdropClientCommands,
  MicdropConfig,
  MicdropServerCommands,
} from './types'

export class MicdropServer {
  public socket: WebSocket | null = null
  public config: MicdropConfig | null = null
  public logger?: Logger

  private startTime = Date.now()

  // When user is speaking, we're streaming chunks for STT
  private currentUserStream?: Duplex

  constructor(socket: WebSocket, config: MicdropConfig) {
    this.socket = socket
    this.config = config
    this.log(`Call started`)

    // Setup STT
    this.config.stt.on('Transcript', this.onTranscript)

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
    this.sendFirstMessage()

    // Listen to events
    socket.on('close', this.onClose)
    socket.on('message', this.onMessage)
  }

  private log(...message: any[]) {
    this.logger?.log(...message)
  }

  private cancel() {
    this.config?.tts.cancel()
    this.config?.agent.cancel()
  }

  private onClose = () => {
    if (!this.config) return
    this.log('Connection closed')
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
    else if (this.currentUserStream) {
      this.log(`Received chunk (${message.byteLength} bytes)`)
      this.currentUserStream.write(message)
    }
  }

  private async onMute() {
    this.currentUserStream?.end()
    this.currentUserStream = undefined
    this.cancel()
  }

  private async onStartSpeaking() {
    if (!this.config) return
    this.currentUserStream?.end()
    this.currentUserStream = new PassThrough()
    this.config.stt.transcribe(this.currentUserStream)
    this.cancel()
  }

  private async onStopSpeaking() {
    this.currentUserStream?.end()
    this.currentUserStream = undefined

    const conversation = this.config?.agent.conversation
    if (conversation && conversation[conversation.length - 1].role === 'user') {
      this.log(
        'User stopped speaking and a transcript already exists, answering'
      )
      this.answer()
    }
  }

  private onTranscript = async (transcript: string) => {
    if (!this.config) return
    this.log(`User transcript: "${transcript}"`)
    this.config.agent.addUserMessage(transcript)

    // Answer if user stopped speaking
    if (!this.currentUserStream) {
      this.log('User stopped speaking, answering')
      this.answer()
    }
  }

  private async sendFirstMessage() {
    if (!this.config) return
    try {
      if (this.config.firstMessage) {
        this.config.agent.addAssistantMessage(this.config.firstMessage)
        await this.speak(this.config.firstMessage)
      } else if (this.config.generateFirstMessage) {
        const answerStream = this.config.agent.answer()
        await this.speak(answerStream)
      }
    } catch (error) {
      console.error('[MicdropServer]', error)
      this.socket?.send(MicdropServerCommands.SkipAnswer)
    }
  }

  private async answer() {
    if (!this.config) return
    this.cancel()
    try {
      // LLM: Generate answer
      const answerStream = this.config.agent.answer()

      // TTS: Generate answer audio
      await this.speak(answerStream)
    } catch (error) {
      console.error('[MicdropServer]', error)
      this.socket?.send(MicdropServerCommands.SkipAnswer)
    }
  }

  // Run text-to-speech and send to client
  private async speak(message: string | Readable) {
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
    const audio = this.config.tts.speak(textStream)

    // Send audio to client
    await this.sendAudio(audio)
  }

  private async sendAudio(audio: Readable) {
    if (!this.socket) return
    if (!audio.readable) {
      this.log('Non readable audio, skipping', audio)
      return
    }

    // Stream audio
    audio.on('data', (chunk) => {
      this.log(`Send audio chunk (${chunk.byteLength} bytes)`)
      this.socket?.send(chunk)
    })
    audio.on('error', (error) => {
      this.log('Error in audio stream', error)
    })
    audio.on('end', () => {
      this.log('Audio stream ended')
    })
  }
}
