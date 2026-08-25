// Checks that a small local model answers, and how it handles the tool calls
// Micdrop adds on every turn (auto end call, semantic turn, noise filtering).
import * as dotenv from 'dotenv'
dotenv.config()

import { createProviders } from '../providers'

const TURNS = [
  'Bonjour, comment ça va ?',
  'Quelle heure est-il', // Unfinished sentence: autoSemanticTurn should wait
  'euh', // Meaningless: autoIgnoreUserNoise should skip
  'Merci, au revoir !', // autoEndCall should fire
]

async function main() {
  const { agent } = await createProviders(
    {
      agent: {
        provider: 'ollama',
        model: process.env.OLLAMA_MODEL || 'qwen3:4b-instruct',
      },
      tts: { provider: 'mock' },
    },
    'fr-FR'
  )
  agent.addTool({
    name: 'get_time',
    description: 'Get the current time',
    execute: () => new Date().toLocaleTimeString('fr-FR'),
  })

  agent.on('SkipAnswer', () => console.log('   -> SkipAnswer'))
  agent.on('EndCall', () => console.log('   -> EndCall'))
  agent.on('CancelLastUserMessage', () =>
    console.log('   -> CancelLastUserMessage')
  )
  agent.on('ToolCall', (call) => console.log('   -> ToolCall', call.name))

  for (const message of TURNS) {
    console.log(`\nUser: "${message}"`)
    agent.addUserMessage(message)
    const started = Date.now()
    let firstChunk = 0
    let answer = ''
    const stream = agent.answer()
    stream.on('data', (chunk: Buffer) => {
      if (!firstChunk) firstChunk = Date.now()
      answer += chunk.toString('utf-8')
    })
    await new Promise((resolve) => stream.on('end', resolve))
    console.log(
      `   first token ${firstChunk ? firstChunk - started : '-'}ms, ` +
        `total ${Date.now() - started}ms`
    )
    console.log(`   Assistant: "${answer.trim()}"`)
  }
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
