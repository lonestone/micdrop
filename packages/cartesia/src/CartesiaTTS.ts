import { convertPCMToMp3, TTS } from '@micdrop/server'
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
}

export class CartesiaTTS extends TTS {
  private socket?: WebSocket
  private initPromise: Promise<void>
  private counter = 0
  private audioStream?: PassThrough
  private convertedStream?: PassThrough
  private canceled = false
  private reconnectTimeout?: NodeJS.Timeout

  constructor(private readonly options: CartesiaTTSOptions) {
    super()

    // Setup WebSocket connection
    this.initPromise = this.initWS()
  }

  speak(textStream: Readable) {
    this.counter++
    this.canceled = false
    const context_id = this.counter.toString()
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
      if (this.canceled) return
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

    textStream.on('error', (error) => {
      this.log('Error in text stream, ending audio stream', error)
      this.stopStreams()
    })

    textStream.on('end', async () => {
      if (this.canceled) return
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

    this.convertedStream = convertPCMToMp3(this.audioStream)
    return this.convertedStream
  }

  cancel() {
    if (!this.audioStream) return
    this.log('Cancel')
    this.canceled = true
    this.stopStreams()

    // Signal Cartesia to stop sending data
    this.socket?.send(
      JSON.stringify({
        context_id: this.counter.toString(),
        cancel: true,
      } satisfies CartesiaCancelPayload)
    )
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
    this.convertedStream?.end()
    this.convertedStream = undefined
  }

  private async initWS() {
    return new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(
        `wss://api.cartesia.ai/tts/websocket?api_key=${this.options.apiKey}&cartesia_version=2025-04-16`
      )
      this.socket = socket

      socket.addEventListener('open', () => {
        this.log('Connection opened')
        resolve()
      })

      socket.addEventListener('error', (error) => {
        this.log('Connection error', error)
        reject(error)
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

        if (code !== 1000) {
          this.reconnect()
        }
      })

      socket.addEventListener('message', (event) => {
        if (this.canceled) return
        try {
          const message: CartesiaResponse = JSON.parse(event.data.toString())
          switch (message.type) {
            case 'chunk':
              const chunk = Buffer.from(message.data, 'base64')
              this.log(`Received audio chunk (${chunk.length} bytes)`)
              this.audioStream?.write(chunk)
              break
            case 'done':
            case 'error':
              this.log('Audio ended')
              this.audioStream?.end()
              this.audioStream = undefined
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
        this.initWS().then(resolve).catch(reject)
      }, 1000)
    })
  }
}
