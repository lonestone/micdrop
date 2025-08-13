import * as dotenv from 'dotenv'
dotenv.config()

import { OpenaiAgent } from '@micdrop/openai'
import { Logger } from '@micdrop/server'
import { Readable } from 'stream'
import { z } from 'zod'

const agent = new OpenaiAgent({
  apiKey: process.env.OPENAI_API_KEY || '',
  systemPrompt: `You are a helpful assistant that helps gather information from the user.

  You need to gently gather these info:
- City where user lives in
- Job of the user
- Number of years of experience of the user

You can use tools to set some info in the database when you get it.
If you need a tool, say you're thinking about it along with the tool call.
Always ask a question until you get all the info.
When you have all the info, you can say good bye.`,
})
agent.logger = new Logger('OpenaiAgent')

agent.addTool({
  name: 'set_city',
  description: 'Set the city where user lives in',
  parameters: z.object({
    city: z.string().describe('City'),
  }),
  callback: ({ city }) => {
    console.log('City:', city)
  },
})

agent.addTool({
  name: 'set_job_info',
  description: 'Set the job info of the user',
  parameters: z.object({
    jobTitle: z.string().describe('Job title').nullable(),
    experience: z
      .number()
      .describe('Number of years of experience of the user')
      .nullable(),
  }),
  callback: (info) => {
    console.log('Job title:', info.jobTitle)
    console.log('Experience:', info.experience)
  },
})

agent.addTool({
  name: 'get_time',
  description: 'Get the current time',
  callback: () => new Date().toLocaleTimeString(),
})

const waitForStreamEnd = (stream: Readable) =>
  new Promise<void>((resolve, reject) => {
    stream.on('data', () => {})
    stream.on('end', () => {
      setTimeout(() => {
        resolve()
      }, 100)
    })
    stream.on('error', (err) => {
      reject(err)
    })
  })

async function answerTo(message: string) {
  agent.addUserMessage(message)
  const stream = agent.answer()
  await waitForStreamEnd(stream)
}

async function run() {
  agent.addAssistantMessage('Hi, where do you live?')
  await answerTo('What is the capital of France?')
  await answerTo('I live in Nantes')
  await answerTo('What time is it?')
  await answerTo(
    'I work as a software engineer, oh and I live more precisely in Rezé'
  )
  await answerTo('I have 8 years of experience')
}

run().catch(console.error)
