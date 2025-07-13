import * as dotenv from 'dotenv'
dotenv.config()

import { CartesiaTTS } from '@micdrop/cartesia'
import { Logger } from '@micdrop/server'
import { Readable } from 'stream'

const text =
  'Micdrop is a set of packages that simplify voice conversations with AI systems. It handles all the complexities of microphone input, speaker output, and network communication, allowing developers to focus on their AI implementation.'

// Create stream with 100ms delay between each word
async function* wordStream(text: string) {
  for (const word of text.split(' ')) {
    yield word + ' '
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
}

const textStream = Readable.from(wordStream(text))

const tts = new CartesiaTTS({
  apiKey: process.env.CARTESIA_API_KEY || '',
  modelId: 'sonic-turbo',
  voiceId: process.env.CARTESIA_VOICE_ID || '',
})
tts.logger = new Logger('CartesiaTTS')

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
