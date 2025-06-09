import { Duplex, PassThrough, Readable } from 'stream'
import WebSocket from 'ws'
import { TTS } from '../TTS'
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
}

export class CartesiaTTS extends TTS {
  private socket?: WebSocket
  private initPromise: Promise<void>
  private counter = 0
  private audioStream?: Duplex

  constructor(private readonly options: CartesiaTTSOptions) {
    super()

    // Setup WebSocket connection
    this.initPromise = this.initWS()
  }

  speech(textStream: Readable) {
    this.counter++
    const context_id = this.counter.toString()
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
    } as const

    textStream.on('data', async (chunk) => {
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
      this.log(`Sent transcript: ${transcript}`)
    })

    textStream.on('end', async () => {
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
    this.audioStream?.end()
    this.audioStream = undefined

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket?.send(
        JSON.stringify({
          context_id: this.counter.toString(),
          cancel: true,
        } satisfies CartesiaCancelPayload)
      )
    }
  }

  destroy() {
    super.destroy()
    this.socket?.removeAllListeners()
    this.socket?.close(1000)
    this.socket = undefined
  }

  private async initWS() {
    return new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(
        `wss://api.cartesia.ai/tts/websocket?api_key=${this.options.apiKey}&cartesia_version=2025-04-16`
      )
      this.socket = socket

      socket.addEventListener('open', () => {
        // Connection is opened. You can start sending audio chunks.
        this.log('Connection opened')
        resolve()
      })

      socket.addEventListener('error', (error) => {
        // An error occurred during the connection.
        // Check the error to understand why
        this.log('Connection error', error)
        reject(error)
      })

      socket.addEventListener('close', ({ code, reason }) => {
        // The connection has been closed
        // If the "code" is equal to 1000, it means we closed intentionally the connection (after the end of the session for example).
        // Otherwise, we can reconnect to the same url.
        this.log('Connection closed', { code, reason })
        this.socket?.removeAllListeners()
        if (code !== 1000) {
          this.log('Reconnecting...')
          setTimeout(() => {
            this.initPromise = this.initWS()
          }, 1000)
        }
      })

      socket.addEventListener('message', (event) => {
        // All the messages we are sending are in JSON format
        const message: CartesiaResponse = JSON.parse(event.data.toString())
        this.log('Message', message)
        switch (message.type) {
          case 'chunk':
            this.audioStream?.write(Buffer.from(message.data, 'base64'))
            break
          case 'done':
            this.audioStream?.end()
            break
        }
      })
    })
  }
}
