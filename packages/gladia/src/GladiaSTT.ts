import { DeepPartial, PcmSTT } from '@micdrop/server'
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
}

export class GladiaSTT extends PcmSTT {
  private socket?: WebSocket
  private initPromise: Promise<void>
  private reconnectTimeout?: NodeJS.Timeout

  constructor(private options: GladiaSTTOptions) {
    super()

    // Setup Websocket connection
    this.initPromise = this.getURL().then((url) => this.initWS(url))
  }

  transcribePCM(pcmStream: Readable) {
    // Read transformed stream and send to Gladia
    pcmStream.on('data', async (chunk) => {
      await this.initPromise
      this.socket?.send(chunk)
      this.log(`Sent audio chunk (${chunk.byteLength} bytes)`)
    })

    // Send silence when the stream ends to force Gladia to transcribe
    pcmStream.on('end', () => this.sendSilence(1))
  }

  destroy() {
    super.destroy()
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = undefined
    }
    this.socket?.removeAllListeners()
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
        this.socket = undefined

        if (code !== 1000) {
          this.reconnect()
        }
      })

      socket.addEventListener('message', (event) => {
        // All the messages we are sending are in JSON format
        const message = JSON.parse(event.data.toString())
        if (message.type === 'transcript' && message.data.is_final) {
          const transcript = message.data.utterance.text
          this.log('Received transcript', transcript)
          this.emit('Transcript', transcript)
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
          .then((url) => this.initWS(url))
          .then(resolve)
          .catch(reject)
      }, 1000)
    })
  }

  private sendSilence(durationSeconds: number) {
    if (!this.socket) return
    const numSamples = Math.round(this.sampleRate * durationSeconds)
    const bytesPerSample = this.bitDepth / 8
    const silenceBuffer = Buffer.alloc(numSamples * bytesPerSample, 0)
    this.socket.send(silenceBuffer)
    this.log(
      `Sent ${durationSeconds * 1000}ms of silence (${silenceBuffer.byteLength} bytes) after stream end`
    )
  }
}
