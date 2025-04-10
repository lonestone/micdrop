import { openai } from './openai'

export async function speech2Text(
  audioBlob: Blob,
  prevMessage?: string
): Promise<string> {
  const response = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file: new File([audioBlob], 'audio.ogg', { type: 'audio/ogg' }),
    prompt: prevMessage,
  })

  return response.text
}
