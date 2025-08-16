import { handleError, Logger, MicdropServer } from '@micdrop/server'
import { FastifyInstance } from 'fastify'
import agents from './agents'
import { checkParams } from './params'
import speech2text from './speech2Text'
import text2speech from './text2Speech'
import { addTools } from './tools'

export default async (app: FastifyInstance) => {
  app.get('/call', { websocket: true }, async (socket) => {
    try {
      const { lang } = await checkParams(socket)

      // Select demo providers (see files agents.ts, speech2text.ts, text2speech.ts)
      const agent = agents.mistral(lang)
      const stt = speech2text.gladia()
      const tts = text2speech.elevenlabs()

      // Add tools
      addTools(agent)

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

      // Enable debug logs
      server.logger = new Logger('MicdropServer')
      agent.logger = new Logger(agent.constructor.name)
      stt.logger = new Logger(stt.constructor.name)
      tts.logger = new Logger(tts.constructor.name)
    } catch (error) {
      handleError(socket, error)
    }
  })
}
