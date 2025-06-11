import { PassThrough, Readable } from 'stream'
import { text } from 'stream/consumers'
import { TTS } from '../TTS'

export interface ElevenLabsTTSOptions {
  apiKey: string
  voiceId: string
}

export class ElevenLabsTTS extends TTS {
  constructor(private readonly options: ElevenLabsTTSOptions) {
    super()
  }

  speech(textStream: Readable) {
    const audioStream = new PassThrough()

    text(textStream).then(async (text) => {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${this.options.voiceId}?output_format=mp3_44100_32`,
        {
          method: 'POST',
          headers: {
            Accept: 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.options.apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
          }),
        }
      )

      if (!response.ok) {
        throw new Error(
          `No response [${response.status}] ${response.statusText}`
        )
      }

      const arrayBuffer = await response.arrayBuffer()
      audioStream.write(Buffer.from(arrayBuffer))
      audioStream.end()
    })

    return audioStream
  }

  cancel() {
    // Do nothing
  }
}
