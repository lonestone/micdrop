import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import {
  TextToSpeechStreamRequestOutputFormat,
  VoiceSettings,
} from '@elevenlabs/elevenlabs-js/api'
import { TTS } from '@micdrop/server'
import { PassThrough, Readable } from 'stream'
import { text } from 'stream/consumers'

export interface ElevenLabsFetchTTSOptions {
  apiKey: string
  voiceId: string
  modelId?: 'eleven_multilingual_v2' | 'eleven_turbo_v2_5' | 'eleven_flash_v2_5'
  language?: string
  outputFormat?: TextToSpeechStreamRequestOutputFormat
  voiceSettings?: VoiceSettings
}

const DEFAULT_MODEL_ID = 'eleven_flash_v2_5'
const DEFAULT_OUTPUT_FORMAT = 'mp3_44100_32'

export class ElevenLabsFetchTTS extends TTS {
  private elevenlabs: ElevenLabsClient
  private speechStream: ReadableStream<Uint8Array> | null = null

  constructor(private readonly options: ElevenLabsFetchTTSOptions) {
    super()
    this.elevenlabs = new ElevenLabsClient({
      apiKey: this.options.apiKey,
    })
  }

  speak(textStream: Readable) {
    const audioStream = new PassThrough()

    const run = async () => {
      try {
        const textContent = await text(textStream)
        const stream = await this.elevenlabs.textToSpeech.stream(
          this.options.voiceId,
          {
            text: textContent,
            modelId: this.options.modelId || DEFAULT_MODEL_ID,
            outputFormat: this.options.outputFormat || DEFAULT_OUTPUT_FORMAT,
            languageCode: this.options.language,
            voiceSettings: this.options.voiceSettings,
          }
        )
        this.speechStream = stream
        for await (const chunk of stream) {
          audioStream.write(chunk)
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Stream was cancelled. This is expected.
        } else {
          audioStream.emit('error', error as Error)
        }
      } finally {
        audioStream.end()
        this.speechStream = null
      }
    }
    run()

    return audioStream
  }

  cancel() {
    if (this.speechStream) {
      this.speechStream.cancel?.()
      this.speechStream = null
    }
  }
}
