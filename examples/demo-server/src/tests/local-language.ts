// Checks how a single-language voice or transcription model constrains the
// language of the conversation.
import * as dotenv from 'dotenv'
dotenv.config()

import { createProviders } from '../providers'

async function main() {
  const cases: Array<[string, any, string]> = [
    [
      'French STT with an English voice (conflict)',
      {
        stt: { provider: 'whisper', model: 'french' },
        tts: { provider: 'kokoro', model: 'bm_george' },
      },
      'fr-FR',
    ],
    [
      'French STT alone, client asks English',
      {
        stt: { provider: 'whisper', model: 'french' },
        tts: { provider: 'mock' },
      },
      'en-US',
    ],
    [
      'Generic STT, client asks English',
      {
        stt: { provider: 'whisper', model: 'base' },
        tts: { provider: 'mock' },
      },
      'en-US',
    ],
    [
      'French voice, client asks English',
      {
        stt: { provider: 'mock' },
        tts: { provider: 'piper', model: 'fr_FR-siwis-medium.onnx' },
      },
      'en-US',
    ],
  ]

  for (const [label, selection, lang] of cases) {
    const { lang: resolved } = await createProviders(
      { agent: { provider: 'mock' }, ...selection },
      lang
    )
    console.log(`${label.padEnd(44)} ${lang} -> ${resolved}`)
  }
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
