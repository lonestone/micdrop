import { parseBuffer } from 'music-metadata'
import WebSocket from 'ws'
import { STT } from './STT'

/**
 * Gladia Real-time V1 STT
 *
 * @see https://docs.gladia.io/chapters/live-stt/getting-started
 */

interface GladiaV1STTOptions {
  apiKey: string
}

export class GladiaV1STT extends STT {
  private socket?: WebSocket
  private initPromise: Promise<void> | undefined

  constructor(private options: GladiaV1STTOptions) {
    super()
  }

  async addAudio(chunk: ArrayBuffer) {
    super.addAudio(chunk)
    console.log('[GladiaV1STT] Adding audio...')
    // Send audio chunk
    await this.init()
    this.socket?.send(chunk)
  }

  async transcribe() {
    console.log('[GladiaV1STT] Transcribing...')
    return 'Hello'
  }

  destroy() {
    console.log('[GladiaV1STT] Destroying...')
    super.destroy()
    this.socket?.close(1000)
    this.socket = undefined
  }

  private async init() {
    if (this.initPromise) {
      // Already initialized
      return this.initPromise
    }
    if (this.chunks.length === 0) {
      throw new Error('GladiaV1STT needs at least one chunk of audio to init')
    }

    this.initPromise = this.initWS()
    return this.initPromise
  }

  private async initWS() {
    // Extract audio metadata from the first chunk
    const metadata = await parseBuffer(Buffer.from(this.chunks[0]))
    console.log('[GladiaV1STT] Audio metadata', {
      encoding: metadata.format.codec,
      sample_rate: metadata.format.sampleRate,
      bit_depth: metadata.format.bitsPerSample,
    })

    // Connect to Gladia V1 STT via WebSocket
    return new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(
        'wss://api.gladia.io/audio/text/audio-transcription'
      )
      this.socket = socket

      socket.addEventListener('open', () => {
        socket.send(
          JSON.stringify({
            x_gladia_key: this.options.apiKey,
            encoding: metadata.format.codec,
            sample_rate: metadata.format.sampleRate,
            bit_depth: metadata.format.bitsPerSample || 16,
          })
        )

        // Connection is opened. You can start sending audio chunks.
        console.log('[GladiaV1STT] Connection opened')
        resolve()
      })

      socket.addEventListener('error', (error) => {
        // An error occurred during the connection.
        // Check the error to understand why
        console.error('[GladiaV1STT] Connection error', error)
        reject(error)
      })

      socket.addEventListener('close', ({ code, reason }) => {
        // The connection has been closed
        // If the "code" is equal to 1000, it means we closed intentionally the connection (after the end of the session for example).
        // Otherwise, you can reconnect to the same url.
        console.log('[GladiaV1STT] Connection closed', { code, reason })
      })

      socket.addEventListener('message', (event) => {
        // All the messages we are sending are in JSON format
        console.log('[GladiaV1STT] Message', JSON.stringify(event, null, 2))
      })
    })
  }
}
