import {
  CallError,
  CallErrorCode,
  CallServer,
  GladiaV1STT,
  handleError,
  waitForParams,
} from '@micdrop/server'
import { FastifyInstance } from 'fastify'
import { text2Speech } from './ai/elevenlabs/text2Speech'
import {
  CANCEL_LAST_USER_MESSAGE,
  END_CALL,
  generateAnswer,
  SKIP_ANSWER,
} from './ai/openai/generateAnswer'
import { callParamsSchema } from './callParams'

// Use AI models if env is set
const isMock = !process.env.OPENAI_API_KEY || !process.env.ELEVENLABS_API_KEY

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
const firstMessage = 'Hello, what can I do for you today?'

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
      new CallServer(socket, {
        systemPrompt,
        firstMessage,

        // LLM: Generate answer
        generateAnswer,
        // TTS: Text to speech
        text2Speech,
        // STT: Speech to text
        speech2Text: new GladiaV1STT({
          apiKey: process.env.GLADIA_API_KEY || '',
        }),
        // speech2Text: new OpenaiWhisperSTT({
        //   apiKey: process.env.OPENAI_API_KEY || '',
        // }),

        // Enable debug logging
        debugLog: true,
        disableTTS: true,
        debugSaveSpeech: true,

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
