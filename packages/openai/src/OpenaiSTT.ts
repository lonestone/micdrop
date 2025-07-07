import { FileSTT } from '@micdrop/server'

/**
 * OpenAI Whisper STT
 *
 * @see https://platform.openai.com/docs/guides/speech-to-text?lang=curl
 */

export interface OpenaiSTTOptions {
  apiKey: string
  model?: string
  language?: string
}

const DEFAULT_MODEL = 'whisper-1'

export class OpenaiSTT extends FileSTT {
  constructor(private options: OpenaiSTTOptions) {
    super()
  }

  async transcribeFile(file: File) {
    // Prepare form data
    const formData = new FormData()
    formData.append('file', file)
    formData.append('model', this.options.model || DEFAULT_MODEL)
    formData.append('response_format', 'text')

    if (this.options.language) {
      formData.append('language', this.options.language)
    }

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
      this.log('Failed to transcribe audio', await response.json())
      throw new Error(`Failed to transcribe audio: ${response.statusText}`)
    }

    return await response.text()
  }
}
