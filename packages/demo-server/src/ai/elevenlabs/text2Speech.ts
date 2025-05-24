export async function text2Speech(text: string): Promise<ArrayBuffer> {
  if (!process.env.ELEVENLABS_VOICE_ID || !process.env.ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_VOICE_ID and ELEVENLABS_API_KEY must be set')
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}?output_format=mp3_44100_32`,
    {
      method: 'POST',
      headers: {
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`No response [${response.status}] ${response.statusText}`)
  }

  return response.arrayBuffer()
}
