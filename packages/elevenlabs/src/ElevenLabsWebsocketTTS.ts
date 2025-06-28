import {
  TextToSpeechStreamRequestOutputFormat,
  VoiceSettings,
} from '@elevenlabs/elevenlabs-js/api'
import { TTS } from '@micdrop/server'
import { PassThrough, Readable } from 'stream'
import WebSocket from 'ws'
import { ElevenLabsWebSocketMessage } from './types'

// API Reference: https://elevenlabs.io/docs/api-reference/text-to-speech/v-1-text-to-speech-voice-id-stream-input

export interface ElevenLabsWebsocketTTSOptions {
  apiKey: string
  voiceId: string
  modelId?: 'eleven_multilingual_v2' | 'eleven_turbo_v2_5' | 'eleven_flash_v2_5'
  language?: string
  outputFormat?: TextToSpeechStreamRequestOutputFormat
  voiceSettings?: VoiceSettings
}

const DEFAULT_MODEL_ID = 'eleven_flash_v2_5'
const DEFAULT_OUTPUT_FORMAT = 'mp3_44100_32'

export class ElevenLabsWebsocketTTS extends TTS {
  private socket?: WebSocket
  private initPromise: Promise<void>
  private audioStream?: PassThrough
  private reconnectTimeout?: NodeJS.Timeout
  private canceled = false
  public debugLog = true

  constructor(private readonly options: ElevenLabsWebsocketTTSOptions) {
    super()
    // Establish the initial WebSocket connection
    this.initPromise = this.initWS()
  }

  /**
   * Initialise the persistent WebSocket connection to ElevenLabs.
   * Handles automatic reconnection (with 1 s delay) when the server closes
   * the connection unexpectedly.
   */
  private initWS(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Build query params
      const params = new URLSearchParams()
      params.append('model_id', this.options.modelId ?? DEFAULT_MODEL_ID)
      if (this.options.language) {
        params.append('language_code', this.options.language)
      }
      params.append(
        'output_format',
        this.options.outputFormat ?? DEFAULT_OUTPUT_FORMAT
      )
      params.append('auto_mode', 'true')

      const uri = `wss://api.elevenlabs.io/v1/text-to-speech/${this.options.voiceId}/stream-input?${params.toString()}`

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
        resolve()
      })

      socket.addEventListener('error', (error) => {
        this.log('Connection error', error)
        reject(error)
      })

      socket.addEventListener('message', (event) => {
        try {
          const message: ElevenLabsWebSocketMessage = JSON.parse(
            event.data.toString()
          )
          this.log('Message', message)

          if (this.audioStream?.writable && !this.canceled && message.audio) {
            this.audioStream.write(Buffer.from(message.audio, 'base64'))
          }

          if (message.isFinal && this.audioStream && !this.canceled) {
            this.audioStream.end()
            this.audioStream = undefined
          }
        } catch {
          // ignore non-JSON messages
        }
      })

      socket.addEventListener('close', ({ code, reason }) => {
        // The connection has been closed
        // If the "code" is equal to 1000, it means we closed intentionally the connection (after the end of the session for example).
        // Otherwise, we can reconnect to the same url.
        this.log('Connection closed', { code, reason })
        this.socket?.removeAllListeners()
        this.socket = undefined
        if (this.audioStream?.writable) {
          this.audioStream.end()
        }
        this.audioStream = undefined

        if (code !== 1000) {
          this.log('Reconnecting...')
          this.reconnectTimeout = setTimeout(() => {
            this.initPromise = this.initWS()
            this.reconnectTimeout = undefined
          }, 1000)
        }
      })
    })
  }

  /**
   * Convert a Node Readable of utf-8 strings into an MP3 audio Readable by
   * streaming the text to ElevenLabs over WebSocket and piping every received
   * base-64 audio chunk back to the caller.
   */
  speak(textStream: Readable) {
    this.canceled = false

    const audioStream = new PassThrough()
    this.audioStream = audioStream

    // Forward text chunks coming from the caller to ElevenLabs
    textStream.on('data', async (chunk) => {
      if (this.canceled) return
      await this.initPromise
      const transcript = chunk.toString('utf-8')
      // Documentation says it should always end with a single space string.
      this.socket?.send(JSON.stringify({ text: `${transcript} ` }))
      this.log(`Sent transcript: ${transcript}`)
    })

    textStream.on('end', () => {
      if (!this.canceled) {
        // Flush buffered text and mark end of utterance.
        this.socket?.send(JSON.stringify({ text: ' ', flush: true }))
        this.log('Flushed text')
      }
    })

    return audioStream
  }

  /**
   * Cancel the current synthesis by closing the WebSocket connection.
   */
  cancel() {
    this.canceled = true
    if (this.audioStream?.writable) {
      this.audioStream.end()
    }
    this.audioStream = undefined
  }

  /**
   * Destroy the TTS instance and close the WebSocket permanently.
   */
  destroy() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = undefined
    }
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.close(1000)
      } catch {
        /* ignore */
      }
    }
    this.socket?.removeAllListeners()
    this.socket = undefined

    if (this.audioStream) {
      this.audioStream.destroy()
      this.audioStream = undefined
    }

    super.destroy()
  }
}
