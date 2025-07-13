import { ElevenLabsTTS } from '@micdrop/elevenlabs'
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
If you're first to speak, say "Hello, how can I help you today?" in ${lang} language.
`
}

export default async (app: FastifyInstance) => {
  app.get('/call', { websocket: true }, async (socket) => {
    try {
      const { lang } = await checkParams(socket)

      /*** Agent ***/

      // const agent = new MockAgent()

      const agent = new OpenaiAgent({
        apiKey: process.env.OPENAI_API_KEY || '',
        systemPrompt: getSystemPrompt(lang),
        autoEndCall: true,
        autoSemanticTurn: true,
        autoIgnoreUserNoise: true,
      })
      agent.logger = new Logger('OpenaiAgent')

      // const agent = new MistralAgent({
      //   apiKey: process.env.MISTRAL_API_KEY || '',
      //   systemPrompt: getSystemPrompt(lang),
      // })
      // agent.logger = new Logger('MistralAgent')

      /*** STT ***/

      // const stt = new MockSTT()

      const stt = new GladiaSTT({
        apiKey: process.env.GLADIA_API_KEY || '',
        settings: {
          realtime_processing: {
            custom_vocabulary: true,
            custom_vocabulary_config: {
              vocabulary: ['Micdrop'],
            },
          },
        },
      })
      stt.logger = new Logger('GladiaSTT')

      /*** TTS ***/

      // const tts = new MockTTS(
      //   path.join(__dirname, '../../demo-client/public/test.mp3')
      // )

      // const stt = new OpenaiSTT({
      //   apiKey: process.env.OPENAI_API_KEY || '',
      // })

      const tts = new ElevenLabsTTS({
        apiKey: process.env.ELEVENLABS_API_KEY || '',
        voiceId: process.env.ELEVENLABS_VOICE_ID || '',
      })
      tts.logger = new Logger('ElevenLabsTTS')

      // const tts = new CartesiaTTS({
      //   apiKey: process.env.CARTESIA_API_KEY || '',
      //   modelId: 'sonic-turbo',
      //   voiceId: process.env.CARTESIA_VOICE_ID || '',
      //   language: 'fr',
      // })
      // tts.logger = new Logger('CartesiaTTS')

      // Start call
      const server = new MicdropServer(socket, {
        // firstMessage: 'Hello!',
        generateFirstMessage: true,
        agent,
        stt,
        tts,
        onEnd(call) {
          console.log('Call ended', call)
        },
      })
      server.logger = new Logger('MicdropServer')
    } catch (error) {
      handleError(socket, error)
    }
  })
}
