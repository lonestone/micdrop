export async function text2Speech(text: string): Promise<ArrayBuffer> {
  if (!process.env.CARTESIA_API_KEY) {
    throw new Error('CARTESIA_API_KEY must be set')
  }
  if (!process.env.CARTESIA_VOICE_ID) {
    throw new Error('CARTESIA_VOICE_ID must be set')
  }

  const response = await fetch(`https://api.cartesia.ai/tts/bytes`, {
    method: 'POST',
    headers: {
      'Cartesia-Version': '2025-04-16',
      Authorization: `Bearer ${process.env.CARTESIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transcript: text,
      model_id: 'sonic-turbo',
      speed: 'fast',
      voice: {
        mode: 'id',
        id: process.env.CARTESIA_VOICE_ID,
      },
      output_format: {
        container: 'mp3',
        sample_rate: 44100,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`No response [${response.status}] ${response.statusText}`)
  }

  return response.arrayBuffer()
}
