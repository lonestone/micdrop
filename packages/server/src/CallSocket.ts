import * as fs from 'fs'
import { WebSocket } from 'ws'
import {
  CallClientCommands,
  CallConfig,
  CallServerCommands,
  Conversation,
  ConversationMessage,
} from './types'

export const END_INTERVIEW = 'END_INTERVIEW'

export class CallSocket {
  public socket: WebSocket | null = null
  public config: CallConfig | null = null

  private startTime = Date.now()
  private lastDebug = Date.now()

  // An answer can be aborted if user is speaking
  private abortAnswer = false

  // When user is speaking, we're waiting to chunks or to stop
  private isSpeaking = false

  // Chunks of user speech since user started speaking
  private chunks: Buffer[] = []

  // Conversation history
  private conversation: Conversation

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
          console.error('[CallSocket]', error)
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

  private addMessage(message: ConversationMessage) {
    if (!this.socket || !this.config) return
    this.conversation.push(message)
    this.socket.send(`${CallServerCommands.Message} ${JSON.stringify(message)}`)
    this.config.onMessage?.(message)
  }

  private async sendAudio(
    audio: ArrayBuffer | NodeJS.ReadableStream,
    abort?: () => void
  ) {
    if (!this.socket) return
    if (this.abortAnswer) {
      abort?.()
      return
    }

    if (Buffer.isBuffer(audio) || audio instanceof ArrayBuffer) {
      // Whole audio as a single buffer
      this.log(`Send audio: (${audio.byteLength} bytes)`)
      this.socket.send(audio)
    } else if ('paused' in audio) {
      // Audio as a stream
      for await (const chunk of audio) {
        if (this.abortAnswer) {
          abort?.()
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
    this.abortAnswer = true
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
      console.warn(`[CallSocket] Message is not a buffer`)
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
        this.abortAnswer = true
      } else if (cmd === CallClientCommands.Mute) {
        // User muted the call
        // Abort answer if there is generation in progress
        this.abortAnswer = true
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

    this.abortAnswer = false

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
        return
      }

      this.log('User transcript:', transcript)

      // Send transcript to client
      this.addMessage({ role: 'user', content: transcript })

      if (this.abortAnswer) {
        this.log('Answer aborted, no answer generated')
        return
      }

      // LLM: Generate answer
      const answer = await this.config.generateAnswer(this.conversation)
      if (this.abortAnswer) {
        this.log('Answer aborted, ignoring answer')
        return
      }

      await this.answer(answer)
    } catch (error) {
      console.error('[CallSocket]', error)
      // TODO: Implement retry
    }
  }

  // Add assistant message and send to client with audio (TTS)
  public async answer(message: string | ConversationMessage) {
    if (!this.socket || !this.config) return
    let isEnd = false

    let content = typeof message === 'string' ? message : message.content
    const metadata = typeof message === 'string' ? undefined : message.metadata

    // Detect end of interview
    if (content.includes(END_INTERVIEW)) {
      content = content.replace(END_INTERVIEW, '').trim()
      isEnd = true
    }

    if (content.length) {
      // Send answer to client
      this.log('Assistant message:', message)
      this.addMessage({ role: 'assistant', content, metadata })

      // TTS: Generate answer audio
      if (!this.config.disableTTS) {
        try {
          const audio = await this.config.text2Speech(content)

          // Remove last assistant message if aborted
          const abort = () => {
            this.log('Answer aborted, removing last assistant message')
            const lastMessage = this.conversation[this.conversation.length - 1]
            if (lastMessage?.role === 'assistant') {
              this.conversation.pop()
              this.socket?.send(CallServerCommands.CancelLastAssistantMessage)
            }
          }

          // Send audio to client
          await this.sendAudio(audio, abort)
        } catch (error) {
          console.error('[CallSocket]', error)
          // TODO: Implement retry
        }
      }
    }

    // End of call
    if (isEnd) {
      this.log('Interview ended')
      this.socket.send(CallServerCommands.EndInterview)
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
