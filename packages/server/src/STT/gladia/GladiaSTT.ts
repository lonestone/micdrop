import WebSocket from 'ws'
import { WavPcmSTT } from './WavPcmSTT'
import { DeepPartial, GladiaLiveSessionPayload } from './types'

/**
 * Gladia Real-time V2 STT
 *
 * @see https://docs.gladia.io/chapters/live-stt/getting-started
 */

export interface GladiaSTTOptions {
  apiKey: string
  config?: DeepPartial<GladiaLiveSessionPayload>
}

export class GladiaSTT extends WavPcmSTT {
  private socket?: WebSocket
  private initPromise: Promise<void>
  private lastTranscript?: string

  constructor(private options: GladiaSTTOptions) {
    super()

    // Setup Websocket connection
    this.initPromise = this.getURL().then((url) => this.initWS(url))
  }

  async onWavPcmChunk(chunk: ArrayBuffer) {
    await this.initPromise
    this.socket?.send(chunk)
    console.log(`[GladiaSTT] Sent audio chunk (${chunk.byteLength} bytes)`)
  }

  async transcribe() {
    const transcript = this.lastTranscript
    this.lastTranscript = undefined
    return transcript || null
  }

  destroy() {
    console.log('[GladiaSTT] Destroying...')
    super.destroy()
    this.socket?.close(1000)
    this.socket = undefined
  }

  private async getURL() {
    // Register real-time transcription to get a WebSocket URL
    const response = await fetch('https://api.gladia.io/v2/live', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gladia-Key': this.options.apiKey,
      },
      body: JSON.stringify({
        encoding: 'wav/pcm',
        sample_rate: this.sampleRate,
        bit_depth: this.bitDepth,
        channels: 1,
        ...this.options.config,
      }),
    })

    if (!response.ok) {
      throw new Error(
        `${response.status}: ${(await response.text()) || response.statusText}`
      )
    }

    const { url } = (await response.json()) as { url: string }
    return url
  }

  private async initWS(url: string) {
    return new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(url)
      this.socket = socket

      socket.addEventListener('open', () => {
        // Connection is opened. You can start sending audio chunks.
        console.log('[GladiaSTT] Connection opened')
        resolve()
      })

      socket.addEventListener('error', (error) => {
        // An error occurred during the connection.
        // Check the error to understand why
        console.error('[GladiaSTT] Connection error', error)
        reject(error)
      })

      socket.addEventListener('close', ({ code, reason }) => {
        // The connection has been closed
        // If the "code" is equal to 1000, it means we closed intentionally the connection (after the end of the session for example).
        // Otherwise, you can reconnect to the same url.
        console.log('[GladiaSTT] Connection closed', { code, reason })
      })

      socket.addEventListener('message', (event) => {
        // All the messages we are sending are in JSON format
        const message = JSON.parse(event.data.toString())
        console.log('[GladiaSTT] Message', message)
        if (message.type === 'transcript' && message.data.is_final) {
          this.lastTranscript = message.data.utterance.text
        }
      })
    })
  }
}
