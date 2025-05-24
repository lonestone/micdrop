import { ElevenLabsClient } from 'elevenlabs'

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY || '',
})

export async function text2SpeechStream(
  text: string
): Promise<NodeJS.ReadableStream> {
  if (!process.env.ELEVENLABS_VOICE_ID || !process.env.ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_VOICE_ID and ELEVENLABS_API_KEY must be set')
  }

  return await client.textToSpeech.convertAsStream(
    process.env.ELEVENLABS_VOICE_ID,
    {
      output_format: 'mp3_44100_32',
      text,
      model_id: 'eleven_multilingual_v2',
    }
  )
}
