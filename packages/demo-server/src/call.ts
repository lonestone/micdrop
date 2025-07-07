import { ElevenLabsWebsocketTTS } from '@micdrop/elevenlabs'
import { GladiaSTT } from '@micdrop/gladia'
import { OpenaiAgent } from '@micdrop/openai'
import { handleError, Logger, MicdropServer } from '@micdrop/server'
import { FastifyInstance } from 'fastify'
import { checkParams } from './params'

// System prompt passed to the LLM
function getSystemPrompt(lang: string) {
  return `You are a voice assistant, your name is Micdrop.
You're in a conversation, keep your answers short and helpful.
Write to be easily read by text-to-speech.
Current date: ${new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}
Current time: ${new Date().toLocaleTimeString()}.
If you're first to speak, your first message must be "Hello, how can I help you today?" in this language: ${lang}.
Otherwise, always answer in the same language as the last user message.
If the user asks to end the call, say goodbye and say END_CALL.
If the last user message is just an interjection or a sound that expresses emotion, hesitation, or reaction (ex: "Uh", "Ahem", "Hmm", "Ah") but doesn't carry any clear meaning like agreeing, refusing, or commanding, just say CANCEL_LAST_USER_MESSAGE.
If the last user message is an incomplete sentence, just say SKIP_ANSWER.
`
}
export default async (app: FastifyInstance) => {
  app.get('/call', { websocket: true }, async (socket, req) => {
    try {
      const { lang } = await checkParams(socket)

      // const stt = new MockSTT()
      // const tts = new MockTTS(
      //   path.join(__dirname, '../../demo-client/public/test.mp3')
      // )
      // const agent = new MockAgent()

      const agent = new OpenaiAgent({
        apiKey: process.env.OPENAI_API_KEY || '',
        systemPrompt: getSystemPrompt(lang),
      })
      agent.logger = new Logger('OpenaiAgent')

      const stt = new GladiaSTT({
        apiKey: process.env.GLADIA_API_KEY || '',
      })

      // const stt = new OpenaiSTT({
      //   apiKey: process.env.OPENAI_API_KEY || '',
      // })

      const tts = new ElevenLabsWebsocketTTS({
        apiKey: process.env.ELEVENLABS_API_KEY || '',
        voiceId: process.env.ELEVENLABS_VOICE_ID || '',
      })
      tts.logger = new Logger('ElevenLabsWebsocketTTS')

      // const tts = new CartesiaTTS({
      //   apiKey: process.env.CARTESIA_API_KEY || '',
      //   modelId: 'sonic-turbo',
      //   voiceId: process.env.CARTESIA_VOICE_ID || '',
      //   language: 'fr',
      // })

      // Start call
      new MicdropServer(socket, {
        // firstMessage: 'Hello!',
        generateFirstMessage: true,
        agent,
        stt,
        tts,
        onEnd(call) {
          console.log('Call ended', call)
        },
      })
    } catch (error) {
      handleError(socket, error)
    }
  })
}
