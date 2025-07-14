import * as dotenv from 'dotenv'
dotenv.config()

import { CartesiaTTS } from '@micdrop/cartesia'
import { Logger } from '@micdrop/server'
import fs from 'fs'
import { createTextStream } from './utils/createLongTextStream'

const textStream = createTextStream(
  `Hello, I'm Micdrop! What can I do for you today?`
)

const tts = new CartesiaTTS({
  apiKey: process.env.CARTESIA_API_KEY || '',
  modelId: 'sonic-turbo',
  voiceId: process.env.CARTESIA_VOICE_ID || '',
})
tts.logger = new Logger('CartesiaTTS')

const audioStream = tts.speak(textStream)

let i = 0
audioStream.on('data', (chunk) => {
  i++
  console.log(`Chunk received and saved #${i} (${chunk.length} bytes)`)
  fs.writeFileSync(`chunk-${i}.webm`, chunk)
})

audioStream.on('error', (error) => {
  console.log('Audio stream error', error)
})

audioStream.on('end', () => {
  console.log('Audio stream ended, destroying tts')
  tts.destroy()
})
