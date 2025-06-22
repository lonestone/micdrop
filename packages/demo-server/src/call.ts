import {
  ElevenLabsTTS,
  GladiaSTT,
  handleError,
  MicdropError,
  MicdropErrorCode,
  MicdropServer,
  waitForParams,
} from '@micdrop/server'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  CANCEL_LAST_USER_MESSAGE,
  END_CALL,
  generateAnswer,
  SKIP_ANSWER,
} from './ai/openai/generateAnswer'

// Required authorization param to start a call
const AUTHORIZATION_KEY = '1234'

// Params schema for the call
export const callParamsSchema = z.object({
  authorization: z.string(),
})
export type CallParams = z.infer<typeof callParamsSchema>

// System prompt passed to the LLM
const systemPrompt = `You are a voice assistant, your name is micdrop (pronounced like "mic drop").
It's a conversation, keep your answers short and helpful.
Write to be easily read by text-to-speech.
Current date: ${new Date().toDateString()}.
Current time: ${new Date().toLocaleTimeString()}.
If the user asks to end the call, say goodbye and say ${END_CALL}.
If the last user message is just an interjection or a sound that expresses emotion, hesitation, or reaction (ex: "Uh", "Ahem", "Hmm", "Ah") but doesn't carry any clear meaning like agreeing, refusing, or commanding, just say ${CANCEL_LAST_USER_MESSAGE}.
If the last user message is an incomplete sentence, just say ${SKIP_ANSWER}.
`

// First message from the assistant
// Optional: leave undefined to generate the first message
const firstMessage = `Bonjour, qu'est-ce que je peux faire pour toi ?`

export default async (app: FastifyInstance) => {
  app.get('/call', { websocket: true }, async (socket, req) => {
    try {
      // Get params from first message
      // Optional, only if we want to check authorization and/or get other params
      const params = await waitForParams(socket, callParamsSchema.parse)
      if (params.authorization !== AUTHORIZATION_KEY) {
        throw new MicdropError(
          MicdropErrorCode.Unauthorized,
          'Invalid authorization'
        )
      }

      // Start call
      new MicdropServer(socket, {
        systemPrompt,
        firstMessage,

        // LLM: Generate answer
        generateAnswer,

        // STT: Speech to text
        speech2Text: new GladiaSTT({
          apiKey: process.env.GLADIA_API_KEY || '',
        }),

        // TTS: Text to speech
        text2Speech: new ElevenLabsTTS({
          apiKey: process.env.ELEVENLABS_API_KEY || '',
          voiceId: process.env.ELEVENLABS_VOICE_ID || '',
        }),

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
      })
    } catch (error) {
      handleError(socket, error)
    }
  })
}
