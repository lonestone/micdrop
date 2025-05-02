import { STT } from './STT'

/**
 * OpenAI Whisper STT
 *
 * @see https://platform.openai.com/docs/guides/speech-to-text?lang=curl
 */

interface OpenaiWhisperSTTOptions {
  apiKey: string
}

export class OpenaiWhisperSTT extends STT {
  constructor(private options: OpenaiWhisperSTTOptions) {
    super()
  }

  async transcribe(prevMessage?: string) {
    // Prepare form data
    const formData = new FormData()
    formData.append('file', this.getFile())
    formData.append('model', 'whisper-1')

    if (prevMessage) {
      formData.append('prompt', `Previous message: ${prevMessage}`)
    }

    // Reset chunks
    this.chunks.length = 0

    const response = await fetch(
      'https://api.openai.com/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
        },
        body: formData,
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to transcribe audio: ${response.statusText}`)
    }

    const { text } = (await response.json()) as { text: string }
    return text
  }
}
