import { Uploadable } from 'openai/uploads'
import { openai } from './openai'

export async function speech2Text(
  file: Blob | Uploadable,
  prevMessage?: string
): Promise<string> {
  const response = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file:
      file instanceof Blob
        ? {
            url: 'http://localhost/speech.mp3',
            blob: async () => file,
          }
        : file,
    prompt: prevMessage,
  })

  return response.text
}
