import { DeepPartial, STT } from '@micdrop/server'
import { Readable } from 'stream'
import WebSocket from 'ws'
import { GladiaLiveSessionPayload } from './types'

/**
 * Gladia Real-time V2 STT
 *
 * @see https://docs.gladia.io/chapters/live-stt/getting-started
 */

export interface GladiaSTTOptions {
  apiKey: string
  settings?: DeepPartial<GladiaLiveSessionPayload>
  transcriptionTimeout?: number
  retryDelay?: number
}

const SAMPLE_RATE = 16000
const BIT_DEPTH = 16
const DEFAULT_TRANSCRIPTION_TIMEOUT = 4000
const DEFAULT_RETRY_DELAY = 1000

export class GladiaSTT extends STT {
  private socket?: WebSocket
  private initPromise: Promise<void>
  private reconnectTimeout?: NodeJS.Timeout
  private transcriptionTimeout?: NodeJS.Timeout
  private audioChunksPending: ArrayBuffer[] = [] // Store audio chunks to send them again if reconnecting

  constructor(private options: GladiaSTTOptions) {
    super()

    // Setup Websocket connection
    this.initPromise = this.getURL()
      .then(this.initWS)
      .catch((error) => {
        console.error('[GladiaSTT] Connection error:', error)
      })
  }

  transcribe(audioStream: Readable) {
    // Read transformed stream and send to Gladia
    audioStream.on('data', async (chunk) => {
      await this.initPromise
      this.audioChunksPending.push(chunk)
      this.socket?.send(chunk)
      this.log(`Sent audio chunk (${chunk.byteLength} bytes)`)
    })

    // Send silence when the stream ends to force Gladia to transcribe
    audioStream.on('end', async () => {
      await this.initPromise
      if (this.audioChunksPending.length === 0) return
      this.sendSilence(2)

      // Timeout transcription if no transcript is received
      this.transcriptionTimeout = setTimeout(() => {
        this.transcriptionTimeout = undefined
        this.log(`Transcription timeout`)
        this.emit('Transcript', '')
        this.audioChunksPending.length = 0
      }, this.options.transcriptionTimeout || DEFAULT_TRANSCRIPTION_TIMEOUT)
    })
  }

  destroy() {
    super.destroy()
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = undefined
    }
    if (this.transcriptionTimeout) {
      clearTimeout(this.transcriptionTimeout)
      this.transcriptionTimeout = undefined
    }
    this.socket?.removeAllListeners()
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket?.close(1000)
    }
    this.socket = undefined
  }

  // Register real-time transcription to get a WebSocket URL
  private getURL = async (): Promise<string> => {
    const response = await fetch('https://api.gladia.io/v2/live', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gladia-Key': this.options.apiKey,
      },
      body: JSON.stringify({
        encoding: 'wav/pcm',
        sample_rate: SAMPLE_RATE,
        bit_depth: BIT_DEPTH,
        channels: 1,
        messages_config: {
          receive_final_transcripts: true,
          receive_speech_events: false,
          receive_pre_processing_events: false,
          receive_realtime_processing_events: false,
          receive_post_processing_events: false,
          receive_acknowledgments: false,
          receive_errors: true,
          receive_lifecycle_events: false,
        },
        ...this.options.settings,
      }),
    })

    if (!response.ok) {
      const status = response.status

      // Don't retry on 4xx errors
      if (status >= 400 && status < 500) {
        throw new Error(`${status}: ${response.statusText}`)
      }

      // Retry on other errors
      this.log('Error getting URL, retrying...', {
        status,
        text: response.statusText,
      })
      await new Promise((resolve) =>
        setTimeout(resolve, this.options.retryDelay ?? DEFAULT_RETRY_DELAY)
      )
      return this.getURL()
    }

    const { url } = (await response.json()) as { url: string }
    return url
  }

  // Connect to Gladia
  private initWS = async (url: string) => {
    return new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(url)
      this.socket = socket

      socket.addEventListener('open', () => {
        this.log('Connection opened')
        resolve()
      })

      socket.addEventListener('error', (error) => {
        reject(error)
      })

      socket.addEventListener('close', ({ code, reason }) => {
        this.socket?.removeAllListeners()
        this.socket = undefined

        if (code !== 1000) {
          this.reconnect()
        } else {
          this.log('Connection closed', { code, reason })
        }
      })

      socket.addEventListener('message', (event) => {
        const message = JSON.parse(event.data.toString())
        if (message.type === 'transcript' && message.data.is_final) {
          const transcript = message.data.utterance.text
          this.log(`Received transcript: "${transcript}"`)
          this.emit('Transcript', transcript)
          // Reset audio chunks and transcript flag to avoid sending them again if reconnecting
          this.audioChunksPending.length = 0

          if (this.transcriptionTimeout) {
            clearTimeout(this.transcriptionTimeout)
            this.transcriptionTimeout = undefined
          }
        }
      })
    })
  }

  private reconnect() {
    this.initPromise = new Promise((resolve, reject) => {
      this.log('Reconnecting...')
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectTimeout = undefined
        this.getURL()
          .then(this.initWS)
          .then(() => {
            // Send audio chunks again if reconnecting during transcription
            if (this.audioChunksPending.length > 0) {
              this.log('Sending audio chunks again')
              this.audioChunksPending.forEach((chunk) =>
                this.socket?.send(chunk)
              )
            }
          })
          .then(resolve)
          .catch((error) => {
            this.log('Reconnection error:', error)
            reject(error)
          })
      }, this.options.retryDelay ?? DEFAULT_RETRY_DELAY)
    })
  }

  private sendSilence(durationSeconds: number) {
    if (!this.socket) return
    const numSamples = Math.round(SAMPLE_RATE * durationSeconds)
    const bytesPerSample = BIT_DEPTH / 8
    const silenceBuffer = Buffer.alloc(numSamples * bytesPerSample)
    this.socket.send(silenceBuffer)
    this.audioChunksPending.push(silenceBuffer.buffer)
    this.log(
      `Sent ${durationSeconds * 1000}ms of silence (${silenceBuffer.byteLength} bytes) after stream end`
    )
  }
}
