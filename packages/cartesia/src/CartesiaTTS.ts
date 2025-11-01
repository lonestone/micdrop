import { TTS } from '@micdrop/server'
import { PassThrough, Readable } from 'stream'
import WebSocket from 'ws'
import {
  CartesiaCancelPayload,
  CartesiaLanguage,
  CartesiaPayload,
  CartesiaResponse,
} from './types'

export interface CartesiaTTSOptions {
  apiKey: string
  modelId: string
  voiceId: string
  language?: CartesiaLanguage
  speed?: 'fast' | 'normal' | 'slow'
  retryDelay?: number
}

const DEFAULT_RETRY_DELAY = 1000

export class CartesiaTTS extends TTS {
  private socket?: WebSocket
  private initPromise: Promise<void>
  private counter = 0
  private audioStream?: PassThrough
  private reconnectTimeout?: NodeJS.Timeout

  constructor(private readonly options: CartesiaTTSOptions) {
    super()

    // Setup WebSocket connection
    this.initPromise = this.initWS().catch((error) => {
      console.error('[CartesiaTTS] Connection error:', error)
    })
  }

  speak(textStream: Readable) {
    this.counter++
    const counter = this.counter
    const context_id = counter.toString()
    this.stopStreams()
    this.audioStream = new PassThrough()

    const config = {
      model_id: this.options.modelId,
      voice: {
        mode: 'id',
        id: this.options.voiceId,
      },
      output_format: {
        container: 'raw',
        encoding: 'pcm_s16le',
        sample_rate: 16000,
      },
      language: this.options.language,
      speed: this.options.speed,
    } as const

    textStream.on('data', async (chunk) => {
      if (counter !== this.counter) return
      await this.initPromise
      const transcript = chunk.toString('utf-8')
      this.socket?.send(
        JSON.stringify({
          ...config,
          transcript,
          context_id,
          continue: true,
        } satisfies CartesiaPayload)
      )
      this.log(`Sent transcript: "${transcript}"`)
    })

    textStream.on('error', (error) => {
      this.log('Error in text stream, ending audio stream', error)
      this.stopStreams()
    })

    textStream.on('end', async () => {
      if (counter !== this.counter) return
      await this.initPromise
      this.socket?.send(
        JSON.stringify({
          ...config,
          transcript: '',
          context_id,
          continue: false,
        } satisfies CartesiaPayload)
      )
    })

    return this.audioStream
  }

  cancel() {
    if (!this.audioStream) return
    this.log('Cancel')
    this.stopStreams()

    // Signal Cartesia to stop sending data
    this.socket?.send(
      JSON.stringify({
        context_id: this.counter.toString(),
        cancel: true,
      } satisfies CartesiaCancelPayload)
    )

    // Increment counter to avoid processing messages from previous calls
    this.counter++
  }

  destroy() {
    super.destroy()
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = undefined
    }
    this.socket?.removeAllListeners()
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket?.close(1000)
    }
    this.socket = undefined
    this.stopStreams()
  }

  private stopStreams() {
    this.audioStream?.end()
    this.audioStream = undefined
  }

  // Connect to Cartesia
  private async initWS() {
    return new Promise<void>((resolve) => {
      const socket = new WebSocket(
        `wss://api.cartesia.ai/tts/websocket?api_key=${this.options.apiKey}&cartesia_version=2025-04-16`
      )
      this.socket = socket

      socket.addEventListener('open', () => {
        this.log('Connection opened')
        resolve()
      })

      socket.addEventListener('error', (error) => {
        this.log('WebSocket error:', error)
      })

      socket.addEventListener('close', ({ code, reason }) => {
        this.socket?.removeAllListeners()
        this.socket = undefined
        this.audioStream?.end()
        this.audioStream = undefined

        if (code !== 1000) {
          this.reconnect()
        } else {
          this.log('Connection closed', { code, reason })
        }
      })

      socket.addEventListener('message', (event) => {
        try {
          const message: CartesiaResponse = JSON.parse(event.data.toString())

          // Ignore messages from previous calls
          if (this.counter.toString() !== message.context_id) return

          switch (message.type) {
            case 'chunk':
              const chunk = Buffer.from(message.data, 'base64')
              this.log(`Received audio chunk (${chunk.length} bytes)`)
              this.audioStream?.write(chunk)
              break
            case 'done':
              this.log('Audio ended')
              this.audioStream?.end()
              this.audioStream = undefined
              break
            case 'error':
              this.log('Error', message.error)
              break
          }
        } catch {
          console.error('[CartesiaTTS] Error parsing message', event.data)
        }
      })
    })
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
      }, this.options.retryDelay ?? DEFAULT_RETRY_DELAY)
    })
  }
}
