import * as fs from 'fs'
import * as path from 'path'
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

  constructor(
    public socket: WebSocket,
    public config: CallConfig
  ) {
    this.conversation = [{ role: 'system', content: config.systemPrompt }]
    this.log(`Call started`)

    // Assistant speaks first

    // LLM: Generate answer
    if (config.firstMessage) {
      this.answer(config.firstMessage)
    } else {
      this.config
        .generateAnswer(this.conversation)
        .then((answer) => this.answer(answer))
        .catch((error) => {
          console.error('[WS]', error)
          this.socket.close()
        })
    }

    // Listen to events
    this.socket.on('close', this.onClose.bind(this))
    this.socket.on('message', this.onMessage.bind(this))
  }

  private addMessage(message: ConversationMessage) {
    this.conversation.push(message)
    this.socket.send(
      `${
        message.role === 'user'
          ? CallServerCommands.UserMessage
          : CallServerCommands.AssistantMessage
      } ${message.content}`
    )
    this.config.onMessage?.(message)
  }

  private onClose() {
    this.log('Connection closed')
    this.abortAnswer = true
    const duration = Math.round((Date.now() - this.startTime) / 1000)

    // End call callback
    this.config.onEnd?.({
      conversation: this.conversation.slice(1), // Remove system message
      duration,
    })

    // Unset params
    // @ts-ignore
    this.socket = null
    // @ts-ignore
    this.config = null
  }

  private async onMessage(message: Buffer) {
    if (!Buffer.isBuffer(message)) {
      console.warn(`[WS] Message is not a buffer`)
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
        const filePath = path.join(__dirname, 'speech.ogg')
        fs.writeFileSync(filePath, Buffer.from(await blob.arrayBuffer()))
        return
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
      console.error('[WS]', error)
      this.socket.close()
    }
  }

  private async answer(message: string) {
    let isEnd = false

    // Detect end of interview
    if (message.includes(END_INTERVIEW)) {
      message = message.replace(END_INTERVIEW, '').trim()
      isEnd = true
    }

    if (message.length) {
      // Send answer to client
      this.log('Assistant message:', message)
      this.addMessage({ role: 'assistant', content: message })

      // TTS: Generate answer audio
      if (!this.config.disableTTS) {
        const audio = await this.config.text2Speech(message)
        if (this.abortAnswer) {
          // Remove last assistant message if aborted
          this.log('Answer aborted, removing last assistant message')
          const lastMessage = this.conversation[this.conversation.length - 1]
          if (lastMessage?.role === 'assistant') {
            this.conversation.pop()
            this.socket.send(CallServerCommands.CancelLastAssistantMessage)
          }
          return
        }

        // Send audio to client
        this.log(`Send audio: (${audio.byteLength} bytes)`)
        this.socket.send(audio)
      }
    }

    // End of call
    if (isEnd) {
      this.log('Interview ended')
      this.socket.send(CallServerCommands.EndInterview)
    }
  }

  private log(...message: any[]) {
    if (!this.config.debugLog) return
    const now = Date.now()
    const delta = now - this.lastDebug
    this.lastDebug = now
    console.log(`[Debug +${delta}ms]`, ...message)
  }
}
