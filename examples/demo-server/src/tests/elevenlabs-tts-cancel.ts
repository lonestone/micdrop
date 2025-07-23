import * as dotenv from 'dotenv'
dotenv.config()

import { ElevenLabsTTS } from '@micdrop/elevenlabs'
import { Logger } from '@micdrop/server'
import { createTextStream } from './utils/createLongTextStream'

const textStream = createTextStream()

const tts = new ElevenLabsTTS({
  apiKey: process.env.ELEVENLABS_API_KEY || '',
  voiceId: process.env.ELEVENLABS_VOICE_ID || '',
})
tts.logger = new Logger('ElevenLabsTTS')

const audioStream = tts.speak(textStream)

const COUNT_STOP = 3
let i = 0
audioStream.on('data', (chunk) => {
  i++
  console.log(`Chunk received #${i} (${chunk.length} bytes)`)
  if (i === COUNT_STOP) {
    console.log('Enough chunks received, cancelling tts')
    tts.cancel()
  }
})

audioStream.on('error', (error) => {
  console.log('Audio stream error', error)
})

audioStream.on('end', () => {
  console.log('Audio stream ended, destroying tts')
  tts.destroy()
})
