// Pocket TTS -> Whisper round trip, with the latency of the first audio.
//
// NUM_STEPS and VOICE pick the quality/speed tradeoff and the voice to clone,
// and TEXT with LANG check what the English model does with another language.
import { PocketTTS } from '@micdrop/pocket-tts'
import { WhisperSTT } from '@micdrop/whisper'
import path from 'path'
import { PassThrough } from 'stream'

const MODEL_DIR = path.join(
  __dirname,
  '../../models/sherpa-onnx-pocket-tts-int8-2026-01-26'
)
const TEXT =
  process.env.TEXT ||
  'Hello, how can I help you today? ' +
    'The weather in Paris is lovely this afternoon.'
const LANG = process.env.LANG_CODE || 'en'

async function main() {
  const tts = new PocketTTS({
    modelDir: MODEL_DIR,
    voice: process.env.VOICE || 'bria',
    numSteps: Number(process.env.NUM_STEPS ?? 2),
    warmup: true,
  })
  tts.logger = { log: (...a: any[]) => console.log('[tts]', ...a) } as any

  const audio: Buffer[] = []
  let firstChunkAt = 0
  let speakStarted = 0

  tts.on('Audio', (chunk) => {
    if (!firstChunkAt) firstChunkAt = Date.now()
    audio.push(chunk)
    console.log(
      `chunk ${chunk.length} bytes (${(chunk.length / 2 / 16000).toFixed(2)}s) ` +
        `at ${Date.now() - speakStarted}ms`
    )
  })
  tts.on('Failed', (texts) => console.error('TTS failed:', texts))

  const warmup = Number(process.env.WARMUP_MS ?? 3000)
  await new Promise((r) => setTimeout(r, warmup))
  console.log(`waited ${warmup}ms before speaking`)

  speakStarted = Date.now()
  const textStream = new PassThrough()
  tts.speak(textStream)
  textStream.end(TEXT)

  let last = Date.now()
  tts.on('Audio', () => (last = Date.now()))
  while (Date.now() - last < 3000) await new Promise((r) => setTimeout(r, 100))

  const pcm = Buffer.concat(audio)
  const generated = Date.now() - speakStarted - 3000
  console.log(
    `\nfirst audio after ${firstChunkAt - speakStarted}ms, ` +
      `${(pcm.length / 2 / 16000).toFixed(2)}s of speech generated in ` +
      `${(generated / 1000).toFixed(2)}s`
  )
  if (pcm.length === 0) throw new Error('No audio produced')

  const stt = new WhisperSTT({ model: 'base', language: LANG, warmup: false })
  const transcript = await new Promise<string>((resolve, reject) => {
    stt.on('Transcript', resolve)
    stt.on('Failed', () => reject(new Error('STT failed')))
    const stream = new PassThrough()
    stt.transcribe(stream)
    for (let i = 0; i < pcm.length; i += 3200) {
      stream.write(pcm.subarray(i, i + 3200))
    }
    stream.end()
  })

  console.log('\ninput :', TEXT)
  console.log('output:', transcript)
  tts.destroy()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
