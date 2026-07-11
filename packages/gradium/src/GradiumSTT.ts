import { STT } from '@micdrop/server'
import { Readable } from 'stream'
import WebSocket from 'ws'
import {
  DEFAULT_INPUT_FORMAT,
  DEFAULT_MODEL_NAME,
  DEFAULT_REGION,
  GradiumASRJsonConfig,
  GradiumASRResponse,
  GradiumASRSetupMessage,
  GradiumSTTOptions,
} from './types'

/**
 * Gradium Real-time STT (ASR)
 *
 * @see https://docs.gradium.ai/guides/speech-to-text
 */

const DEFAULT_CONNECTION_TIMEOUT = 5000
const DEFAULT_TRANSCRIPTION_TIMEOUT = 4000
const DEFAULT_RETRY_DELAY = 1000
const DEFAULT_MAX_RETRY = 3

export class GradiumSTT extends STT {
  private socket?: WebSocket
  private initPromise: Promise<void>
  private reconnectTimeout?: NodeJS.Timeout
  private transcriptionTimeout?: NodeJS.Timeout
  private audioChunksPending: Buffer[] = [] // Store audio chunks to send them again if reconnecting
  private transcript = '' // Accumulated text segments for the current utterance
  private flushId = 0
  private retryCount = 0
  private destroyed = false

  constructor(private options: GradiumSTTOptions) {
    super()

    // Setup WebSocket connection
    this.initPromise = this.connect()
  }

  transcribe(audioStream: Readable) {
    // New utterance: start from a clean transcript for this stream
    this.transcript = ''

    // Read audio stream and send to Gradium
    audioStream.on('data', async (chunk: Buffer) => {
      this.audioChunksPending.push(chunk)
      await this.initPromise
      this.sendAudioChunk(chunk)
      this.log(`Sent audio chunk (${chunk.byteLength} bytes)`)
    })

    // Handle stream end: flush buffered audio so the server finalizes the
    // pending segments and confirms with a matching "flushed" message.
    audioStream.on('end', async () => {
      await this.initPromise
      if (this.audioChunksPending.length === 0) return
      const flushId = ++this.flushId
      this.sendFlush(flushId)

      // Timeout transcription if no "flushed" confirmation is received
      this.transcriptionTimeout = setTimeout(() => {
        this.transcriptionTimeout = undefined
        this.log('Transcription timeout')
        this.emitTranscript()
      }, this.options.transcriptionTimeout || DEFAULT_TRANSCRIPTION_TIMEOUT)
    })
  }

  destroy() {
    super.destroy()
    this.destroyed = true
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

  private connect(): Promise<void> {
    return this.initWS().catch((error) => {
      console.error('[GradiumSTT] Connection error:', error)
      this.reconnect()
    })
  }

  private getEndpoint() {
    const region = this.options.region ?? DEFAULT_REGION
    return `wss://${region}.api.gradium.ai/api/speech/asr`
  }

  private async initWS(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(this.getEndpoint(), {
        headers: {
          'x-api-key': this.options.apiKey,
        },
      })
      this.socket = socket

      const timeout = setTimeout(() => {
        this.log('Connection timeout')
        socket.removeAllListeners()
        socket.close()
        this.socket = undefined
        reject(new Error('WebSocket connection timeout'))
      }, this.options.connectionTimeout ?? DEFAULT_CONNECTION_TIMEOUT)

      socket.addEventListener('open', () => {
        clearTimeout(timeout)
        this.sendSetup()
        this.log('Connection opened')
        resolve()
      })

      socket.addEventListener('error', (error) => {
        clearTimeout(timeout)
        this.log('WebSocket error:', error)
        reject(new Error('WebSocket connection error'))
      })

      socket.addEventListener('close', ({ code, reason }) => {
        clearTimeout(timeout)
        this.socket?.removeAllListeners()
        this.socket = undefined

        if (code !== 1000) {
          this.reconnect()
        } else {
          this.log('Connection closed', { code, reason })
        }
      })

      socket.addEventListener('message', (event) => {
        try {
          this.handleMessage(JSON.parse(event.data.toString()))
        } catch {
          this.log('Error parsing message', event.data)
        }
      })
    })
  }

  private buildJsonConfig(): GradiumASRJsonConfig | undefined {
    const config: GradiumASRJsonConfig = { ...this.options.jsonConfig }
    if (this.options.language && config.language === undefined) {
      config.language = this.options.language
    }
    return Object.keys(config).length > 0 ? config : undefined
  }

  private sendSetup() {
    this.socket?.send(
      JSON.stringify({
        type: 'setup',
        model_name: this.options.modelName ?? DEFAULT_MODEL_NAME,
        input_format: this.options.inputFormat ?? DEFAULT_INPUT_FORMAT,
        json_config: this.buildJsonConfig(),
      } satisfies GradiumASRSetupMessage)
    )
    this.log('Sent setup')
  }

  private sendAudioChunk(chunk: Buffer) {
    this.socket?.send(
      JSON.stringify({
        type: 'audio',
        audio: chunk.toString('base64'),
      })
    )
  }

  private sendFlush(flushId: number) {
    this.socket?.send(JSON.stringify({ type: 'flush', flush_id: flushId }))
    this.log(`Sent flush (flush_id=${flushId})`)
  }

  private emitTranscript() {
    const transcript = this.transcript.replace(/\s+/g, ' ').trim()
    this.log(`Received transcript: "${transcript}"`)
    this.emit('Transcript', transcript)
    // Reset state and clear timeout
    this.transcript = ''
    this.audioChunksPending.length = 0
    if (this.transcriptionTimeout) {
      clearTimeout(this.transcriptionTimeout)
      this.transcriptionTimeout = undefined
    }
  }

  private handleMessage(message: GradiumASRResponse) {
    switch (message.type) {
      case 'ready':
        this.log('Server ready')
        break

      case 'text':
        if (typeof message.text === 'string') {
          this.transcript += (this.transcript ? ' ' : '') + message.text
          this.log(`Received text segment: "${message.text}"`)
        }
        break

      case 'end_text':
        // Segment finalized, nothing to accumulate (text already received)
        break

      case 'flushed':
        // The flush for the current utterance completed: all pending segments
        // have been received, emit the full transcript.
        if (message.flush_id === this.flushId) {
          this.emitTranscript()
        }
        break

      case 'step':
        // Voice activity detection frames, ignored
        break

      case 'end_of_stream':
        this.log('End of stream')
        break

      case 'error':
        this.log('Error:', message.message, message.code)
        break
    }
  }

  private reconnect() {
    if (this.destroyed) return
    this.retryCount++
    if (this.retryCount > (this.options.maxRetry ?? DEFAULT_MAX_RETRY)) {
      this.log('Max retries reached, giving up')
      this.emit('Failed', this.audioChunksPending)
      return
    }

    this.initPromise = new Promise((resolve) => {
      this.log('Reconnecting...')
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectTimeout = undefined
        this.initWS()
          .then(() => {
            this.retryCount = 0

            // Resend audio chunks if reconnecting during transcription. Setup
            // is sent on open and the server replays the whole utterance, so
            // reset the accumulated segments to avoid duplicating them.
            if (this.audioChunksPending.length > 0) {
              this.log('Sending audio chunks again')
              this.transcript = ''
              this.audioChunksPending.forEach((chunk) =>
                this.sendAudioChunk(chunk)
              )
            }
          })
          .then(resolve)
          .catch((error) => {
            this.log('Reconnection error:', error)
            this.reconnect()
          })
      }, this.options.retryDelay ?? DEFAULT_RETRY_DELAY)
    })
  }
}
