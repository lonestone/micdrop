import {
  CallError,
  CallErrorCode,
  CallServer,
  CartesiaTTS,
  GladiaSTT,
  handleError,
  waitForParams,
} from '@micdrop/server'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { generateAnswer } from './ai/mistral/generateAnswer'

// Required authorization param to start a call
const AUTHORIZATION_KEY = '1234'

// Params schema for the call
export const callParamsSchema = z.object({
  authorization: z.string(),
})
export type CallParams = z.infer<typeof callParamsSchema>

// System prompt passed to the LLM
const date = new Date()
const systemPrompt = `Tu es un assistant vocal, ton nom est micdrop.
C'est une conversation, garde tes réponses courtes et utiles.
Écris de manière à être facilement lu par la synthèse vocale.
Date actuelle : ${date.toLocaleDateString('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})}.
Heure actuelle : ${date.getHours()} heures ${date.getMinutes()} minutes.
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
        throw new CallError(CallErrorCode.Unauthorized, 'Invalid authorization')
      }

      // Start call
      new CallServer(socket, {
        systemPrompt,
        firstMessage,

        // LLM: Generate answer
        generateAnswer,

        // STT: Speech to text
        speech2Text: new GladiaSTT({
          apiKey: process.env.GLADIA_API_KEY || '',
          config: {
            language_config: {
              code_switching: false,
              languages: ['fr'],
            },
          },
        }),

        // TTS: Text to speech
        text2Speech: new CartesiaTTS({
          apiKey: process.env.CARTESIA_API_KEY || '',
          modelId: 'sonic-turbo',
          voiceId: process.env.CARTESIA_VOICE_ID || '',
          language: 'fr',
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
