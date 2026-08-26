// Cancels Pocket TTS mid-sentence and checks that its audio stops there.
//
// The generation runs on a worker thread and hands its chunks over as they
// come, so an interruption has to reach it between two chunks rather than
// wait for the sentence to be finished.
import { PocketTTS } from '@micdrop/pocket-tts'
import { Logger } from '@micdrop/server'
import path from 'path'
import { createTextStream } from './utils/createLongTextStream'

const MODEL_DIR = path.join(
  __dirname,
  '../../models/sherpa-onnx-pocket-tts-int8-2026-01-26'
)

const tts = new PocketTTS({ modelDir: MODEL_DIR, warmup: false })
tts.logger = new Logger('PocketTTS')

const COUNT_STOP = 3
let i = 0
let cancelledAt = 0

tts.on('Audio', (chunk) => {
  i++
  console.log(`Chunk received #${i} (${chunk.length} bytes)`)
  if (cancelledAt) {
    console.error(`Chunk after cancel, ${Date.now() - cancelledAt}ms later`)
  }
  if (i === COUNT_STOP) {
    console.log('Enough chunks received, cancelling tts')
    cancelledAt = Date.now()
    tts.cancel()
  }
})

tts.on('Failed', (texts) => {
  console.log('TTS failed', texts)
  tts.destroy()
})

tts.speak(createTextStream())

// Anything still generating would report itself in the meantime
setTimeout(() => {
  console.log(`No chunk for ${Date.now() - cancelledAt}ms after the cancel`)
  tts.destroy()
}, 5000)
