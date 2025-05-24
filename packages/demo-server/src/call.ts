import {
  CallConfig,
  CallError,
  CallErrorCode,
  CallServer,
  handleError,
  waitForParams,
} from '@micdrop/server'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { text2Speech } from './ai/elevenlabs/text2Speech'
import {
  CANCEL_LAST_USER_MESSAGE,
  END_CALL,
  generateAnswer,
  SKIP_ANSWER,
} from './ai/openai/generateAnswer'
import { speech2Text } from './ai/openai/speech2Text'

// Required authorization param to start a call
const AUTHORIZATION_KEY = '1234'

// Params schema for the call
export const callParamsSchema = z.object({
  authorization: z.string(),
})
export type CallParams = z.infer<typeof callParamsSchema>

const config: CallConfig = {
  // System prompt passed to the LLM
  systemPrompt: `You are a voice assistant, your name is micdrop (pronounced like "mic drop").
    It's a conversation, keep your answers short and helpful.
    Write to be easily read by text-to-speech.
    Current date: ${new Date().toDateString()}.
    Current time: ${new Date().toLocaleTimeString()}.
    If the user asks to end the call, say goodbye and say ${END_CALL}.
    If the last user message is just an interjection or a sound that expresses emotion, hesitation, or reaction (ex: "Uh", "Ahem", "Hmm", "Ah") but doesn't carry any clear meaning like agreeing, refusing, or commanding, just say ${CANCEL_LAST_USER_MESSAGE}.
    If the last user message is an incomplete sentence, just say ${SKIP_ANSWER}.
  `,

  // First message from the assistant
  // Optional, omit to generate the first message
  firstMessage: 'Hello, what can I do for you today?',

  // LLM: Generate answer
  generateAnswer,
  // TTS: Text to speech
  text2Speech,
  // STT: Speech to text
  speech2Text,

  // Enable debug logging
  debugLog: true,
  // disableTTS: true,
  // debugSaveSpeech: true,

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
      if (params.authorization !== AUTHORIZATION_KEY) {
        throw new CallError(CallErrorCode.Unauthorized, 'Invalid authorization')
      }

      // Start call
      new CallServer(socket, config)
    } catch (error) {
      handleError(socket, error)
    }
  })
}
