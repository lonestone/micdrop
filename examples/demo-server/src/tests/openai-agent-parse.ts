import * as dotenv from 'dotenv'
dotenv.config()

import { OpenaiAgent } from '@micdrop/openai'
import { Logger } from '@micdrop/server'
import { waitForStreamEnd } from './utils/waitForStreamEnd'

const agent = new OpenaiAgent({
  apiKey: process.env.OPENAI_API_KEY || '',
  systemPrompt: `You are a helpful assistant.

  When the user give you a city, append the city and country names in JSON (no markdown code block, just compacted JSON) to your answer (say thanks before).`,
  extract: {
    json: true,
    saveInMetadata: true,
    callback: (value: any) => {
      console.log('Extracted value:', value)
    },
  },
})
agent.logger = new Logger('OpenaiAgent')

agent.on('Message', (message) => {
  console.log('Message:', message)
})

async function run() {
  agent.addAssistantMessage('Hi, where do you live?')
  agent.addUserMessage('I live in Paris')
  const stream = agent.answer()
  await waitForStreamEnd(stream)
}

run().catch(console.error)
