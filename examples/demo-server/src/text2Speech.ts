import { CartesiaTTS } from '@micdrop/cartesia'
import { ElevenLabsTTS } from '@micdrop/elevenlabs'
import { MockTTS } from '@micdrop/server'
import path from 'path'

export default {
  // Mock
  mock: () =>
    new MockTTS([
      path.join(__dirname, '../../demo-client/public/chunk-1.wav'),
      path.join(__dirname, '../../demo-client/public/chunk-2.wav'),
    ]),

  // ElevenLabs
  elevenlabs: () =>
    new ElevenLabsTTS({
      apiKey: process.env.ELEVENLABS_API_KEY || '',
      voiceId: process.env.ELEVENLABS_VOICE_ID || '',
      modelId: 'eleven_flash_v2_5',
    }),

  // Cartesia
  cartesia: () =>
    new CartesiaTTS({
      apiKey: process.env.CARTESIA_API_KEY || '',
      modelId: 'sonic-turbo',
      voiceId: process.env.CARTESIA_VOICE_ID || '',
      language: 'fr',
    }),
}
