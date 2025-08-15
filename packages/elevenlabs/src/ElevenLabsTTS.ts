import { TTS } from '@micdrop/server'
import { PassThrough, Readable } from 'stream'
import WebSocket from 'ws'
import {
  DEFAULT_MODEL_ID,
  DEFAULT_OUTPUT_FORMAT,
  ElevenLabsTTSOptions,
  ElevenLabsWebSocketAudioOutputMessage,
  ElevenLabsWebSocketMessage,
} from './types'

// API Reference: https://elevenlabs.io/docs/api-reference/text-to-speech/v-1-text-to-speech-voice-id-stream-input

const WS_INACTIVITY_TIMEOUT = 180

export class ElevenLabsTTS extends TTS {
  private socket?: WebSocket
  private initPromise: Promise<void>
  private audioStream?: PassThrough
  private textEnded = false // Whether the text stream has ended
  private textSent = '' // Text sent to ElevenLabs
  private textBuffer = '' // Buffer of text to send to ElevenLabs
  private receivedAudioText = '' // Text of chunks received from ElevenLabs
  private keepAliveInterval?: NodeJS.Timeout
  private reconnectTimeout?: NodeJS.Timeout
  private canceled = false

  constructor(private readonly options: ElevenLabsTTSOptions) {
    super()
    // Setup WebSocket connection
    this.initPromise = this.initWS().catch((error) => {
      console.error('[ElevenLabsTTS] Connection error:', error)
    })
  }

  speak(textStream: Readable) {
    this.canceled = false
    this.audioStream?.end()
    this.audioStream = new PassThrough()
    this.textEnded = false
    this.textBuffer = ''
    this.textSent = ''
    this.receivedAudioText = ''

    // Forward text chunks coming from the caller to ElevenLabs
    textStream.on('data', async (chunk) => {
      if (this.canceled) return
      await this.initPromise
      const text = chunk.toString('utf-8').replace(/[\r\n]+/g, ' ')
      const spaceIndex = text.lastIndexOf(' ')
      if (spaceIndex === -1) {
        this.textBuffer += text
      } else {
        this.sendTranscript(this.textBuffer + text.slice(0, spaceIndex + 1))
        this.textBuffer = text.slice(spaceIndex + 1)
      }
    })

    textStream.on('error', (error) => {
      this.log('Error in text stream, ending audio stream', error)
      this.audioStream?.end()
      this.audioStream = undefined
    })

    textStream.on('end', async () => {
      if (this.canceled) return
      await this.initPromise
      // Send last buffered text
      if (this.textBuffer.trim()) {
        this.sendTranscript(this.textBuffer + ' ')
        this.textBuffer = ''
      }
      this.textEnded = true
      // Flush buffered text and mark end of utterance.
      this.socket?.send(JSON.stringify({ text: ' ', flush: true }))
      this.log('Flushed text')
    })

    return this.audioStream
  }

  cancel() {
    if (!this.audioStream) return
    this.log('Cancel')
    this.canceled = true
    this.textSent = ''
    this.receivedAudioText = ''
    this.audioStream.end()
    this.audioStream = undefined
    this.socket?.send(JSON.stringify({ text: ' ', flush: true }))
  }

  destroy() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = undefined
    }
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval)
      this.keepAliveInterval = undefined
    }
    this.socket?.removeAllListeners()
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket?.close(1000)
    }
    this.socket = undefined

    this.audioStream?.end()
    this.audioStream = undefined

    super.destroy()
  }

  private initWS(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Build query params
      const params = new URLSearchParams()
      params.append('model_id', this.options.modelId ?? DEFAULT_MODEL_ID)
      params.append(
        'output_format',
        this.options.outputFormat ?? DEFAULT_OUTPUT_FORMAT
      )
      params.append('inactivity_timeout', WS_INACTIVITY_TIMEOUT.toString())
      params.append(
        'voice_settings',
        JSON.stringify(this.options.voiceSettings)
      )
      if (this.options.language) {
        params.append('language_code', this.options.language)
      }

      const uri = `wss://api.elevenlabs.io/v1/text-to-speech/${this.options.voiceId}/stream-input?${params.toString()}`

      // Connect to ElevenLabs
      const socket = new WebSocket(uri, {
        headers: {
          'xi-api-key': this.options.apiKey,
        },
      })
      this.socket = socket

      socket.addEventListener('open', () => {
        this.log('Connection opened')

        // Send initialization / keep-alive message with voice settings
        this.socket?.send(
          JSON.stringify({
            text: ' ',
            voice_settings: this.options.voiceSettings,
          })
        )

        // Start keep-alive interval
        this.keepAliveInterval = setInterval(
          () => {
            this.log('Sending keep-alive message')
            this.socket?.send(JSON.stringify({ text: ' ' }))
          },
          (WS_INACTIVITY_TIMEOUT - 1) * 1000
        )

        resolve()
      })

      socket.addEventListener('error', (error) => {
        reject(error)
      })

      socket.addEventListener('message', (event) => {
        if (this.canceled) return
        try {
          this.onMessage(JSON.parse(event.data.toString()))
        } catch (error) {
          console.error('[ElevenLabsTTS] Error:', error)
          console.error('[ElevenLabsTTS] Event data during error:', event.data)
        }
      })

      socket.addEventListener('close', ({ code, reason }) => {
        this.socket?.removeAllListeners()
        this.socket = undefined

        this.audioStream?.end()
        this.audioStream = undefined

        if (this.keepAliveInterval) {
          clearInterval(this.keepAliveInterval)
          this.keepAliveInterval = undefined
        }

        if (
          // Error: voice_id_does_not_exist
          code !== 1008
        ) {
          this.reconnect()
        } else {
          this.log('Connection closed', { code, reason })
        }
      })
    })
  }

  private onMessage(message: ElevenLabsWebSocketMessage) {
    if ('audio' in message && message.audio) {
      this.processAudioMessage(message)
    }
    if ('isFinal' in message && message.isFinal) {
      this.log('Audio ended')
      this.audioStream?.end()
      this.audioStream = undefined
    }
    if ('error' in message) {
      throw new Error(message.error)
    }
  }

  private processAudioMessage(message: ElevenLabsWebSocketAudioOutputMessage) {
    const chunk = Buffer.from(message.audio, 'base64')

    // Check text of received audio chunk
    if (message.alignment) {
      const chunkText = message.alignment.chars.join('')
      const receivedAudioText = this.receivedAudioText + chunkText

      // Ignore chunk if it is from previous session
      if (this.textSent.trim().indexOf(receivedAudioText.trim()) === -1) {
        this.log(`Ignore audio chunk ("${chunkText}")`)
        return
      }

      this.log(`Received audio chunk ("${chunkText}")`)
      this.receivedAudioText = receivedAudioText

      // Fix isFinal (apparently ElevenLabs doesn't send it like it should)
      this.fixIsFinal(message)
    }

    // Send to audio stream
    this.audioStream?.write(chunk)
  }

  private fixIsFinal(message: ElevenLabsWebSocketAudioOutputMessage) {
    if (message.isFinal || !this.textEnded) return
    if (this.receivedAudioText.trim() === this.textSent.trim()) {
      message.isFinal = true
    }
  }

  private sendTranscript(text: string) {
    this.textSent += text
    this.socket?.send(JSON.stringify({ text, try_trigger_generation: true }))
    this.log(`Sent transcript: "${text}"`)
  }

  private reconnect() {
    this.initPromise = new Promise((resolve, reject) => {
      this.log('Reconnecting...')
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectTimeout = undefined
        this.initWS()
          .then(resolve)
          .catch((error) => {
            this.log('Reconnection error:', error)
            reject(error)
          })
      }, 1000)
    })
  }
}
