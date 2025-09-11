import { STT } from '@micdrop/server'
import { Readable } from 'stream'
import WebSocket from 'ws'

/**
 * OpenAI Real-time STT
 *
 * @see https://platform.openai.com/docs/guides/speech-to-text
 */

export interface OpenaiSTTOptions {
  apiKey: string
  model?: string
  language?: string
  prompt?: string
  transcriptionTimeout?: number
}

const DEFAULT_MODEL = 'gpt-4o-transcribe'
const DEFAULT_LANGUAGE = 'en'
const SAMPLE_RATE = 16000
const BIT_DEPTH = 16
const DEFAULT_TRANSCRIPTION_TIMEOUT = 4000

export class OpenaiSTT extends STT {
  private socket?: WebSocket
  private initPromise: Promise<void>
  private reconnectTimeout?: NodeJS.Timeout
  private transcriptionTimeout?: NodeJS.Timeout
  private audioChunksPending: string[] = [] // Store Base64 encoded audio chunks
  private ephemeralToken?: string

  constructor(private options: OpenaiSTTOptions) {
    super()

    // Setup WebSocket connection (first create session, then connect)
    this.initPromise = this.createTranscriptionSession()
      .then(() => this.initWS())
      .catch((error) => {
        console.error('[OpenaiSTT] Connection error:', error)
      })
  }

  transcribe(audioStream: Readable) {
    // Read audio stream and send to OpenAI
    audioStream.on('data', async (chunk: Buffer) => {
      await this.initPromise
      const base64Audio = chunk.toString('base64')
      this.audioChunksPending.push(base64Audio)
      this.sendAudioChunk(base64Audio)
      this.log(`Sent audio chunk (${chunk.byteLength} bytes)`)
    })

    // Handle stream end
    audioStream.on('end', async () => {
      await this.initPromise
      if (this.audioChunksPending.length === 0) return
      this.sendSilence(2)

      // Timeout transcription if no transcript is received
      this.transcriptionTimeout = setTimeout(() => {
        this.transcriptionTimeout = undefined
        this.log('Transcription timeout')
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

  private async createTranscriptionSession(): Promise<void> {
    const payload = {
      input_audio_format: 'pcm16',
      input_audio_transcription: {
        model: this.options.model || DEFAULT_MODEL,
        language: this.options.language || DEFAULT_LANGUAGE,
        prompt:
          this.options.prompt || 'Transcribe the incoming audio in real time.',
      },
      turn_detection: {
        type: 'server_vad',
        silence_duration_ms: 1000,
      },
      input_audio_noise_reduction: {
        type: 'near_field',
      },
    }

    const response = await fetch(
      'https://api.openai.com/v1/realtime/transcription_sessions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'realtime=v1',
        },
        body: JSON.stringify(payload),
      }
    )

    if (!response.ok) {
      throw new Error(
        `Failed to create transcription session: ${response.status} ${response.text()}`
      )
    }

    const data = (await response.json()) as { client_secret: { value: string } }
    this.ephemeralToken = data.client_secret.value
    this.log('Transcription session created')
  }

  private async initWS(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const socket = new WebSocket('wss://api.openai.com/v1/realtime', {
        headers: {
          Authorization: `Bearer ${this.ephemeralToken}`,
          'OpenAI-Beta': 'realtime=v1',
        },
      })
      this.socket = socket

      socket.addEventListener('open', () => {
        this.log('Connection opened')
        resolve()
      })

      socket.addEventListener('error', (error: any) => {
        reject(error)
      })

      socket.addEventListener(
        'close',
        ({ code, reason }: { code: number; reason: string }) => {
          this.socket?.removeAllListeners()
          this.socket = undefined

          if (code !== 1000) {
            this.reconnect()
          } else {
            this.log('Connection closed', { code, reason })
          }
        }
      )

      socket.addEventListener('message', (event: any) => {
        this.handleMessage(JSON.parse(event.data.toString()))
      })
    })
  }

  private sendAudioChunk(base64Audio: string) {
    if (!this.socket) return

    const audioMessage = {
      type: 'input_audio_buffer.append',
      audio: base64Audio,
    }

    this.socket.send(JSON.stringify(audioMessage))
  }

  private handleMessage(message: any) {
    switch (message.type) {
      // case 'input_audio_buffer.committed':
      //   this.log('Audio buffer committed')
      //   break

      // case 'input_audio_buffer.speech_started':
      //   this.log('Speech started')
      //   break

      // case 'input_audio_buffer.speech_stopped':
      //   this.log('Speech stopped')
      //   break

      // case 'conversation.item.input_audio_transcription.delta':
      //   this.log(`Received transcript delta: "${message.delta}"`)
      //   break

      case 'conversation.item.input_audio_transcription.completed':
        const transcript = message.transcript || ''
        this.log(`Received completed transcript: "${transcript}"`)
        this.emit('Transcript', transcript)
        // Reset audio chunks and clear timeout
        this.audioChunksPending.length = 0
        if (this.transcriptionTimeout) {
          clearTimeout(this.transcriptionTimeout)
          this.transcriptionTimeout = undefined
        }
        break

      case 'error':
        console.error('[OpenaiSTT] Error:', message.error)
        break

      default:
        break
    }
  }

  private reconnect() {
    this.initPromise = new Promise((resolve, reject) => {
      this.log('Reconnecting...')
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectTimeout = undefined
        this.createTranscriptionSession()
          .then(() => this.initWS())
          .then(() => {
            // Send audio chunks again if reconnecting during transcription
            if (this.audioChunksPending.length > 0) {
              this.log('Sending audio chunks again')
              this.audioChunksPending.forEach((chunk) =>
                this.sendAudioChunk(chunk)
              )
            }
          })
          .then(resolve)
          .catch((error) => {
            this.log('Reconnection error:', error)
            reject(error)
          })
      }, 1000)
    })
  }

  private sendSilence(durationSeconds: number) {
    if (!this.socket) return
    const numSamples = Math.round(SAMPLE_RATE * durationSeconds)
    const bytesPerSample = BIT_DEPTH / 8
    const silenceBuffer = Buffer.alloc(numSamples * bytesPerSample)
    const base64Audio = silenceBuffer.toString('base64')
    this.audioChunksPending.push(base64Audio)
    this.sendAudioChunk(base64Audio)
    this.log(
      `Sent ${durationSeconds * 1000}ms of silence (${silenceBuffer.byteLength} bytes) after stream end`
    )
  }
}
