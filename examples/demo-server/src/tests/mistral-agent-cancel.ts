import * as dotenv from 'dotenv'
dotenv.config()

import { MistralAgent } from '@micdrop/mistral'
import { Logger } from '@micdrop/server'

const agent = new MistralAgent({
  apiKey: process.env.MISTRAL_API_KEY || '',
  systemPrompt: 'You are a voice assistant, your name is Micdrop.',
})
agent.logger = new Logger('MistralAgent')

agent.addUserMessage('Tell me a story')
const stream = agent.answer()

const COUNT_STOP = 10
let i = 0
stream.on('data', (chunk) => {
  i++
  console.log(`Chunk received #${i}: ${chunk}`)
  if (i === COUNT_STOP) {
    console.log('Enough chunks received, cancelling agent')
    agent.cancel()
  }
})

stream.on('error', (error) => {
  console.log('Answer stream error', error)
})

stream.on('end', () => {
  console.log('Answer stream ended, destroying agent')
  agent.destroy()
})
