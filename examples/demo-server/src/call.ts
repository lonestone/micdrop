import { openai } from '@ai-sdk/openai'
import { AiSdkAgent } from '@micdrop/ai-sdk'
import { ElevenLabsTTS } from '@micdrop/elevenlabs'
import { GladiaSTT } from '@micdrop/gladia'
import { handleError, Logger, MicdropServer } from '@micdrop/server'
import { FastifyInstance } from 'fastify'
import { checkParams } from './params'

// System prompt passed to the LLM
function getSystemPrompt(lang: string) {
  return `You are a voice assistant named Micdrop.
Your role is to help the user with their questions and requests.

## Instructions
- If you're first to speak, say "Hello, how can I help you today?" in ${lang} language.
- You're in a conversation, keep your answers short and helpful.
- Write all numbers and abbreviations in full.
- Write your messages in full sentences, plain text, juste one paragraph.
- Do not use formatting or Markdown.
- Do not use lists or bullet points.
- Do not use abbreviations.
- Do not use emojis.

## Context
Current date: ${new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}
Current time: ${new Date().toLocaleTimeString()}.
`
}

export default async (app: FastifyInstance) => {
  app.get('/call', { websocket: true }, async (socket) => {
    try {
      const { lang } = await checkParams(socket)

      /*** Agent ***/

      // const agent = new MockAgent()

      // OpenAI version
      // const agent = new OpenaiAgent({
      //   apiKey: process.env.OPENAI_API_KEY || '',
      //   systemPrompt: getSystemPrompt(lang),
      //   autoEndCall: true,
      //   autoSemanticTurn: true,
      //   autoIgnoreUserNoise: true,
      // })
      // agent.logger = new Logger('OpenaiAgent')

      // AI SDK version
      const agent = new AiSdkAgent({
        model: openai('gpt-4o'),
        systemPrompt: getSystemPrompt(lang),
        autoEndCall: true,
        autoSemanticTurn: true,
        autoIgnoreUserNoise: true,
      })
      agent.logger = new Logger('AiSdkAgent')

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

      // const stt = new OpenaiSTT({
      //   apiKey: process.env.OPENAI_API_KEY || '',
      // })

      /*** TTS ***/

      // const tts = new MockTTS([
      //   path.join(__dirname, '../../demo-client/public/chunk-1.wav'),
      //   path.join(__dirname, '../../demo-client/public/chunk-2.wav'),
      // ])

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
