import * as dotenv from 'dotenv'
dotenv.config()

// Verifies that MistralSTT reuses a single connection across several utterances
// (thanks to input_audio.flush, without input_audio.end / reconnect).

import { MistralSTT } from '@micdrop/mistral'
import { Logger } from '@micdrop/server'
import * as fs from 'fs'
import * as path from 'path'
import { PassThrough } from 'stream'

const chunkDir = path.join(__dirname, '../../../demo-client/public')

const stt = new MistralSTT({
  apiKey: process.env.MISTRAL_API_KEY || '',
})
stt.logger = new Logger('MistralSTT')

// Stream the demo chunks through a fresh PassThrough (one utterance)
function transcribeOnce() {
  const audioStream = new PassThrough()
  stt.transcribe(audioStream)
  for (let i = 1; ; i++) {
    const p = path.join(chunkDir, `chunk-${i}.wav`)
    if (!fs.existsSync(p)) break
    audioStream.write(fs.readFileSync(p))
  }
  audioStream.end()
}

// Wait for the next Transcript event
function nextTranscript(): Promise<string> {
  return new Promise((resolve) => stt.once('Transcript', resolve))
}

async function main() {
  console.log('--- Utterance #1 ---')
  transcribeOnce()
  console.log('Transcript #1:', await nextTranscript())

  console.log('--- Utterance #2 (same MistralSTT instance) ---')
  transcribeOnce()
  console.log('Transcript #2:', await nextTranscript())

  stt.destroy()
}

main()
