// Piper -> Whisper round trip in French, with the latency of the first audio.
//
// WARMUP_MS stands for the time a real call spends on transcription and on the
// first tokens of the answer, which the process spends loading its voice.
import { PiperTTS } from '@micdrop/piper'
import { WhisperSTT } from '@micdrop/whisper'
import path from 'path'
import { PassThrough } from 'stream'

const VOICE = path.join(__dirname, '../../voices/fr_FR-siwis-medium.onnx')
const TEXT =
  "Bonjour, comment puis-je vous aider aujourd'hui ? " +
  'Il fait beau à Paris cet après-midi.'

async function main() {
  const tts = new PiperTTS({ modelPath: VOICE })
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

  const warmup = Number(process.env.WARMUP_MS ?? 1500)
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
  console.log(
    `\nfirst audio after ${firstChunkAt - speakStarted}ms, ` +
      `${(pcm.length / 2 / 16000).toFixed(2)}s total`
  )
  if (pcm.length === 0) throw new Error('No audio produced')

  const stt = new WhisperSTT({ model: 'base', language: 'fr', warmup: false })
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
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
