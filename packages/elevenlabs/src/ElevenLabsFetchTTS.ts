import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import { TTS } from '@micdrop/server'
import { PassThrough, Readable } from 'stream'
import { text } from 'stream/consumers'
import {
  DEFAULT_MODEL_ID,
  DEFAULT_OUTPUT_FORMAT,
  ElevenLabsTTSOptions,
} from './types'

export class ElevenLabsFetchTTS extends TTS {
  private elevenlabs: ElevenLabsClient
  private speechStream: ReadableStream<Uint8Array> | null = null

  constructor(private readonly options: ElevenLabsTTSOptions) {
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
    if (!this.speechStream) return
    this.log('Cancel')
    this.speechStream.cancel?.()
    this.speechStream = null
  }
}
