import { parseBuffer } from 'music-metadata'
import WebSocket from 'ws'
import { STT } from './STT'

/**
 * Gladia Real-time V2 STT
 *
 * @see https://docs.gladia.io/chapters/live-stt/getting-started
 */

interface GladiaV2STTOptions {
  apiKey: string
}

export class GladiaV2STT extends STT {
  private socket?: WebSocket
  private initPromise: Promise<void> | undefined

  constructor(private options: GladiaV2STTOptions) {
    super()
  }

  async addAudio(chunk: ArrayBuffer) {
    super.addAudio(chunk)
    console.log('[GladiaV2STT] Adding audio...')
    // Send audio chunk
    await this.init()
    this.socket?.send(chunk)
  }

  async transcribe() {
    console.log('[GladiaV2STT] Transcribing...')
    return 'Hello'
  }

  destroy() {
    console.log('[GladiaV2STT] Destroying...')
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
      throw new Error('GladiaV2STT needs at least one chunk of audio to init')
    }

    this.initPromise = this.getURL().then((url) => this.initWS(url))
    return this.initPromise
  }

  private async getURL() {
    console.log('parseAudioFile', parseAudioFile(Buffer.from(this.chunks[0])))

    // Extract audio metadata from the first chunk
    const metadata = await parseBuffer(Buffer.from(this.chunks[0]))
    console.log('[GladiaV2STT] Audio metadata', {
      encoding: metadata.format.codec,
      sample_rate: metadata.format.sampleRate,
      bit_depth: metadata.format.bitsPerSample,
      channels: metadata.format.numberOfChannels,
    })

    throw new Error('Not implemented')

    // Register real-time transcription to get a WebSocket URL
    const response = await fetch('https://api.gladia.io/v2/live', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gladia-Key': this.options.apiKey,
      },
      body: JSON.stringify({
        encoding: 'wav/pcm',
        sample_rate: metadata.format.sampleRate,
        bit_depth: metadata.format.bitsPerSample,
        channels: metadata.format.numberOfChannels,
      }),
    })

    if (!response.ok) {
      throw new Error(
        `${response.status}: ${(await response.text()) || response.statusText}`
      )
    }

    const { url } = (await response.json()) as { url: string }
    if (typeof url !== 'string') {
      throw new Error('Invalid response from Gladia: ' + url)
    }
    return url
  }

  private async initWS(url: string) {
    return new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(url)
      this.socket = socket

      socket.addEventListener('open', () => {
        // Connection is opened. You can start sending audio chunks.
        console.log('[GladiaV2STT] Connection opened')
        resolve()
      })

      socket.addEventListener('error', (error) => {
        // An error occurred during the connection.
        // Check the error to understand why
        console.error('[GladiaV2STT] Connection error', error)
        reject(error)
      })

      socket.addEventListener('close', ({ code, reason }) => {
        // The connection has been closed
        // If the "code" is equal to 1000, it means we closed intentionally the connection (after the end of the session for example).
        // Otherwise, you can reconnect to the same url.
        console.log('[GladiaV2STT] Connection closed', { code, reason })
      })

      socket.addEventListener('message', (event) => {
        // All the messages we are sending are in JSON format
        const message = JSON.parse(event.data.toString())
        console.log('[GladiaV2STT] Message', event)
      })
    })
  }
}

function parseAudioFile(buffer: Buffer<ArrayBufferLike>) {
  const textDecoder = new TextDecoder()
  if (
    textDecoder.decode(buffer.subarray(0, 4)) !== 'RIFF' ||
    textDecoder.decode(buffer.subarray(8, 12)) !== 'WAVE' ||
    textDecoder.decode(buffer.subarray(12, 16)) !== 'fmt '
  ) {
    throw new Error('Unsupported file format')
  }
  const fmtSize = buffer.readUInt32LE(16)
  let encoding
  const format = buffer.readUInt16LE(20)
  if (format === 1) {
    encoding = 'wav/pcm'
  } else if (format === 6) {
    encoding = 'wav/alaw'
  } else if (format === 7) {
    encoding = 'wav/ulaw'
  } else {
    throw new Error('Unsupported encoding')
  }
  const channels = buffer.readUInt16LE(22)
  const sample_rate = buffer.readUInt32LE(24)
  const bit_depth = buffer.readUInt16LE(34)
  let nextSubChunk = 16 + 4 + fmtSize
  while (
    textDecoder.decode(buffer.subarray(nextSubChunk, nextSubChunk + 4)) !==
    'data'
  ) {
    nextSubChunk += 8 + buffer.readUInt32LE(nextSubChunk + 4)
  }
  return {
    encoding,
    sample_rate,
    channels,
    bit_depth,
    startDataChunk: nextSubChunk,
    buffer,
  }
}
