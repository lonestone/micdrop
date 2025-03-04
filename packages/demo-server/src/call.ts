import {
  CallConfig,
  CallError,
  CallErrorCode,
  CallSocket,
  handleError,
  waitForParams,
} from '@micdrop/server'
import { FastifyInstance } from 'fastify'
import ai from './ai'
import aiMock from './ai-mock'
import { callParamsSchema } from './callParams'

// Use AI models if env is set
const isMock = !process.env.OPENAI_API_KEY || !process.env.ELEVENLABS_API_KEY

const config: CallConfig = {
  // System prompt passed to the LLM
  systemPrompt:
    'You are a voice assistant. It\s a conversation, keep your answers short and helpful.',
  // First message from the assistant
  // Optional, omit to generate the first message
  firstMessage: 'Hello, what can I do for you today?',

  // AI methods: generateAnswer, text2Speech, speech2Text
  ...(isMock ? aiMock : ai),

  // Enable debug logging
  debugLog: true,

  // Optional: called when a message is received from the user
  onMessage(message) {
    console.log('Message:', message)
  },
  // Optional: called when the call ends
  onEnd() {
    console.log('End')
  },
}

export default async (app: FastifyInstance) => {
  app.get('/call', { websocket: true }, async (socket, req) => {
    try {
      // Get params from first message
      // Optional, only if we want to check authorization and/or get other params
      const params = await waitForParams(socket, callParamsSchema.parse)
      if (params.authorization !== '1234') {
        throw new CallError(CallErrorCode.Unauthorized, 'Invalid authorization')
      }

      // Start call
      new CallSocket(socket, config)
    } catch (error) {
      handleError(socket, error)
    }
  })
}
