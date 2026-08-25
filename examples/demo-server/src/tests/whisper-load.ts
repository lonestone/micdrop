// Checks that the model is loaded when the STT is instantiated, not when the
// first utterance arrives, which is what makes the cost land during call setup.
//
// Run it twice in separate processes so the weights are not already in memory:
//   WAIT_MS=0    npx ts-node-dev ... src/tests/whisper-load.ts
//   WAIT_MS=8000 npx ts-node-dev ... src/tests/whisper-load.ts
import { WhisperSTT } from '@micdrop/whisper'
import { PassThrough } from 'stream'

async function main() {
  const wait = Number(process.env.WAIT_MS ?? 0)
  const model = process.env.MODEL || 'small'

  // One second of tone, enough to pass the minimum duration check
  const pcm = Buffer.alloc(16000 * 2)
  for (let i = 0; i < 16000; i++) {
    pcm.writeInt16LE(Math.round(Math.sin(i / 8) * 200), i * 2)
  }

  const stt = new WhisperSTT({ model, language: 'fr', warmup: true })
  await new Promise((r) => setTimeout(r, wait))

  const started = Date.now()
  await new Promise<void>((resolve) => {
    stt.once('Transcript', () => resolve())
    const stream = new PassThrough()
    stt.transcribe(stream)
    stream.end(pcm)
  })
  console.log(
    `${model}: waited ${wait}ms, first transcript ${Date.now() - started}ms`
  )
  stt.destroy()
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
