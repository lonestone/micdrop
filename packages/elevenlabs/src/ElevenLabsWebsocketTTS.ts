import { TTS } from '@micdrop/server'
import { PassThrough, Readable } from 'stream'
import WebSocket from 'ws'
import {
  DEFAULT_MODEL_ID,
  DEFAULT_OUTPUT_FORMAT,
  ElevenLabsTTSOptions,
  ElevenLabsWebSocketMessage,
} from './types'

// API Reference: https://elevenlabs.io/docs/api-reference/text-to-speech/v-1-text-to-speech-voice-id-stream-input

const WS_INACTIVITY_TIMEOUT = 180

export class ElevenLabsWebsocketTTS extends TTS {
  private socket?: WebSocket
  private initPromise: Promise<void>
  private audioStream?: PassThrough
  private keepAliveInterval?: NodeJS.Timeout
  private reconnectTimeout?: NodeJS.Timeout
  private canceled = false

  constructor(private readonly options: ElevenLabsTTSOptions) {
    super()
    // Setup WebSocket connection
    this.initPromise = this.initWS()
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
        this.log('Connection error', error)
        reject(error)
      })

      socket.addEventListener('message', (event) => {
        if (this.canceled) return
        try {
          const message: ElevenLabsWebSocketMessage = JSON.parse(
            event.data.toString()
          )

          if ('audio' in message && message.audio) {
            this.log('Audio chunk received')
            this.audioStream?.write(Buffer.from(message.audio, 'base64'))
          }
          if ('isFinal' in message && message.isFinal) {
            this.log('Audio finalized')
            this.audioStream?.end()
            this.audioStream = undefined
          }
          if ('error' in message) {
            console.error('ElevenLabs error', message.error)
          }
        } catch {
          console.error('ElevenLabs error parsing message', event.data)
        }
      })

      socket.addEventListener('close', ({ code, reason }) => {
        // The connection has been closed
        // If the "code" is equal to 1000, it means we closed intentionally the connection (after the end of the session for example).
        // Otherwise, we can reconnect to the same url.
        this.log('Connection closed', { code, reason })

        this.socket?.removeAllListeners()
        this.socket = undefined

        this.audioStream?.end()
        this.audioStream = undefined

        if (this.keepAliveInterval) {
          clearInterval(this.keepAliveInterval)
          this.keepAliveInterval = undefined
        }

        if (
          code !== 1000 &&
          // Error: voice_id_does_not_exist
          code !== 1008
        ) {
          this.reconnect()
        }
      })
    })
  }

  private reconnect() {
    this.initPromise = new Promise((resolve, reject) => {
      this.log('Reconnecting...')
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectTimeout = undefined
        this.initWS().then(resolve).catch(reject)
      }, 1000)
    })
  }

  speak(textStream: Readable) {
    this.canceled = false

    this.audioStream?.end()
    const audioStream = new PassThrough()
    this.audioStream = audioStream
    let buffer = ''

    // Forward text chunks coming from the caller to ElevenLabs
    textStream.on('data', async (chunk) => {
      if (this.canceled) return
      await this.initPromise
      const text = chunk.toString('utf-8')
      this.socket?.send(JSON.stringify({ text, try_trigger_generation: true }))
      this.log(`Sent transcript: ${text}`)
    })

    textStream.on('end', async () => {
      if (this.canceled) return
      await this.initPromise
      // Flush buffered text and mark end of utterance.
      this.socket?.send(JSON.stringify({ text: ' ', flush: true }))
      this.log('Flushed text')
    })

    return audioStream
  }

  cancel() {
    this.canceled = true
    this.audioStream?.end()
    this.audioStream = undefined
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
    this.socket?.close(1000)
    this.socket = undefined

    if (this.audioStream) {
      this.audioStream.destroy()
      this.audioStream = undefined
    }

    super.destroy()
  }
}
