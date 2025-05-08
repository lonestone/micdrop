import * as fs from 'fs'
import { WebSocket } from 'ws'
import {
  CallClientCommands,
  CallConfig,
  CallServerCommands,
  Conversation,
  ConversationMessage,
} from './types'

interface Processing {
  aborted: boolean
}

export class CallServer {
  public socket: WebSocket | null = null
  public config: CallConfig | null = null

  private startTime = Date.now()
  private lastDebug = Date.now()

  // An answer can be aborted if user is speaking
  private processing?: Processing

  // When user is speaking, we're waiting to chunks or to stop
  private isSpeaking = false

  // Chunks of user speech since user started speaking
  private chunks: Buffer[] = []

  // Conversation history
  private conversation: Conversation

  // Enable speaker streaming
  private speakerStreamingEnabled = false

  constructor(socket: WebSocket, config: CallConfig) {
    this.socket = socket
    this.config = config
    this.conversation = [{ role: 'system', content: config.systemPrompt }]
    this.log(`Call started`)

    // Assistant speaks first
    if (config.firstMessage) {
      this.answer(config.firstMessage)
    } else {
      this.config
        .generateAnswer(this.conversation)
        .then((answer) => this.answer(answer))
        .catch((error) => {
          console.error('[CallServer]', error)
          socket?.close()
          // TODO: Implement retry
        })
    }

    // Listen to events
    socket.on('close', this.onClose.bind(this))
    socket.on('message', this.onMessage.bind(this))
  }

  // Reset conversation
  public resetConversation(conversation: Conversation) {
    this.log('Reset conversation')
    this.conversation = conversation
  }

  private abortProcessing() {
    if (!this.processing) return
    this.processing.aborted = true
    this.processing = undefined
  }

  private addMessage(message: ConversationMessage) {
    if (!this.socket || !this.config) return
    this.conversation.push(message)
    this.socket.send(`${CallServerCommands.Message} ${JSON.stringify(message)}`)
    this.config.onMessage?.(message)
  }

  private async sendAudio(
    audio: ArrayBuffer | NodeJS.ReadableStream,
    processing: Processing,
    onAbort?: () => void
  ) {
    if (!this.socket) return
    if (processing.aborted) {
      onAbort?.()
      return
    }

    if (Buffer.isBuffer(audio) || audio instanceof ArrayBuffer) {
      // Whole audio as a single buffer
      this.log(`Send audio: (${audio.byteLength} bytes)`)
      this.socket.send(audio)
    } else if ('paused' in audio) {
      // Enable speaker streaming if not already enabled
      if (!this.speakerStreamingEnabled) {
        this.socket.send(CallServerCommands.EnableSpeakerStreaming)
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
      this.log(`Unknown audio type: ${audio}`)
    }
  }

  private onClose() {
    if (!this.config) return
    this.log('Connection closed')
    this.abortProcessing()
    const duration = Math.round((Date.now() - this.startTime) / 1000)

    // End call callback
    this.config.onEnd?.({
      conversation: this.conversation.slice(1), // Remove system message
      duration,
    })

    // Unset params
    this.socket = null
    this.config = null
  }

  private async onMessage(message: Buffer) {
    if (!Buffer.isBuffer(message)) {
      console.warn(`[CallServer] Message is not a buffer`)
      return
    }

    // Commands
    if (message.byteLength < 15) {
      const cmd = message.toString()
      this.log(`Command: ${cmd}`)

      if (cmd === CallClientCommands.StartSpeaking) {
        // User started speaking
        this.isSpeaking = true
        // Abort answer if there is generation in progress
        this.abortProcessing()
      } else if (cmd === CallClientCommands.Mute) {
        // User muted the call
        this.isSpeaking = false
        this.chunks.length = 0
        // Abort answer if there is generation in progress
        this.abortProcessing()
      } else if (cmd === CallClientCommands.StopSpeaking) {
        // User stopped speaking
        this.isSpeaking = false
        await this.onStopSpeaking()
      }
    }

    // Audio chunk
    else if (Buffer.isBuffer(message) && this.isSpeaking) {
      this.log(`Received chunk (${message.byteLength} bytes)`)
      this.chunks.push(message)
    }
  }

  private async onStopSpeaking() {
    if (!this.config) return

    // Do nothing if there is no chunk
    if (this.chunks.length === 0) return

    this.abortProcessing()
    const processing = (this.processing = { aborted: false })

    // Combine audio blob
    const blob = new Blob(this.chunks, { type: 'audio/ogg' })

    // Reset chunks for next user speech
    this.chunks.length = 0

    try {
      // Save file to disk
      if (this.config.debugSaveSpeech) {
        const filename = `speech-${Date.now()}.ogg`
        fs.writeFileSync(filename, Buffer.from(await blob.arrayBuffer()))
        this.log(`Saved speech: ${filename}`)
      }

      // STT: Get transcript and send to client
      const transcript = await this.config.speech2Text(
        blob,
        this.conversation[this.conversation.length - 1]?.content
      )
      if (!transcript) {
        this.log('Ignoring empty transcript')
        this.socket?.send(CallServerCommands.SkipAnswer)
        return
      }

      this.log('User transcript:', transcript)

      // Send transcript to client
      this.addMessage({ role: 'user', content: transcript })

      if (processing.aborted) {
        this.log('Answer aborted, no answer generated')
        return
      }

      // LLM: Generate answer
      const answer = await this.config.generateAnswer(this.conversation)
      if (processing.aborted) {
        this.log('Answer aborted, ignoring answer')
        return
      }

      await this.answer(answer, processing)
    } catch (error) {
      console.error('[CallServer]', error)
      this.socket?.send(CallServerCommands.SkipAnswer)
      // TODO: Implement retry
    }
  }

  // Add assistant message and send to client with audio (TTS)
  public async answer(
    message: string | ConversationMessage,
    processing?: Processing
  ) {
    if (!this.socket || !this.config) return

    if (!processing) {
      this.abortProcessing()
      processing = this.processing = { aborted: false }
    }

    if (typeof message === 'string') {
      message = { role: 'assistant', content: message }
    }

    // Cancel last user message
    if (message.commands?.cancelLastUserMessage) {
      this.log('Cancelling last user message')
      const lastMessage = this.conversation[this.conversation.length - 1]
      if (lastMessage?.role === 'user') {
        this.conversation.pop()
        this.socket?.send(CallServerCommands.CancelLastUserMessage)
      }
      return
    }

    // Skip answer
    if (!message.content.length || message.commands?.skipAnswer) {
      this.log('Skipping answer')
      this.socket?.send(CallServerCommands.SkipAnswer)
      return
    }

    // Send answer to client
    this.log('Assistant message:', message)
    this.addMessage(message)

    // TTS: Generate answer audio
    if (!this.config.disableTTS) {
      try {
        // Remove last assistant message if aborted
        const onAbort = () => {
          this.log('Answer aborted, removing last assistant message')
          const lastMessage = this.conversation[this.conversation.length - 1]
          if (lastMessage?.role === 'assistant') {
            this.conversation.pop()
            this.socket?.send(CallServerCommands.CancelLastAssistantMessage)
          }
        }

        if (processing.aborted) {
          onAbort()
          return
        }

        const audio = await this.config.text2Speech(message.content)

        // Send audio to client
        await this.sendAudio(audio, processing, onAbort)
      } catch (error) {
        console.error('[CallServer]', error)
        this.socket?.send(CallServerCommands.SkipAnswer)
        // TODO: Implement retry
      }
    }

    // End of call
    if (message.commands?.endCall) {
      this.log('Call ended')
      this.socket.send(CallServerCommands.EndCall)
    }
  }

  private log(...message: any[]) {
    if (!this.config?.debugLog) return
    const now = Date.now()
    const delta = now - this.lastDebug
    this.lastDebug = now
    console.log(`[Debug +${delta}ms]`, ...message)
  }
}
