// Kokoro -> Whisper round trip: synthesize a sentence, transcribe it back.
import { KokoroTTS } from '@micdrop/kokoro'
import { WhisperSTT } from '@micdrop/whisper'
import { writeFileSync } from 'fs'
import { PassThrough } from 'stream'

const TEXT = 'Hello, how can I help you today? The weather is fine in Paris.'

function wavHeader(dataLength: number, sampleRate = 16000) {
  const b = Buffer.alloc(44)
  b.write('RIFF', 0)
  b.writeUInt32LE(36 + dataLength, 4)
  b.write('WAVEfmt ', 8)
  b.writeUInt32LE(16, 16)
  b.writeUInt16LE(1, 20)
  b.writeUInt16LE(1, 22)
  b.writeUInt32LE(sampleRate, 24)
  b.writeUInt32LE(sampleRate * 2, 28)
  b.writeUInt16LE(2, 32)
  b.writeUInt16LE(16, 34)
  b.write('data', 36)
  b.writeUInt32LE(dataLength, 40)
  return b
}

async function main() {
  console.log('--- Kokoro ---')
  const tts = new KokoroTTS({ voice: 'americanFemale', warmup: false })
  tts.logger = { log: (...a: any[]) => console.log('[tts]', ...a) } as any

  const audio: Buffer[] = []
  tts.on('Audio', (chunk) => {
    console.log(`audio chunk: ${chunk.length} bytes`)
    audio.push(chunk)
  })
  tts.on('Failed', (texts) => console.error('TTS failed:', texts))

  const textStream = new PassThrough()
  const t0 = Date.now()
  tts.speak(textStream)
  textStream.write(TEXT)
  textStream.end()

  // Wait until the audio stops coming, the answer is two sentences long
  let lastChunkAt = Date.now()
  tts.on('Audio', () => (lastChunkAt = Date.now()))
  while (Date.now() - lastChunkAt < 5000) {
    await new Promise((r) => setTimeout(r, 250))
  }
  const pcm = Buffer.concat(audio)
  console.log(
    `synthesized ${pcm.length} bytes = ${(pcm.length / 2 / 16000).toFixed(2)}s in ${Date.now() - t0}ms`
  )
  if (pcm.length === 0) throw new Error('No audio produced')
  writeFileSync('/tmp/kokoro.wav', Buffer.concat([wavHeader(pcm.length), pcm]))

  console.log('--- Whisper ---')
  const stt = new WhisperSTT({ model: 'base', language: 'en', warmup: false })
  stt.logger = { log: (...a: any[]) => console.log('[stt]', ...a) } as any

  const transcript = await new Promise<string>((resolve, reject) => {
    stt.on('Transcript', resolve)
    stt.on('Failed', () => reject(new Error('STT failed')))
    const audioStream = new PassThrough()
    const t1 = Date.now()
    stt.transcribe(audioStream)
    stt.on('Transcript', () =>
      console.log(`transcribed in ${Date.now() - t1}ms`)
    )
    // Feed it in chunks, like the client does
    for (let i = 0; i < pcm.length; i += 3200) {
      audioStream.write(pcm.subarray(i, i + 3200))
    }
    audioStream.end()
  })

  console.log('input :', TEXT)
  console.log('output:', transcript)
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
