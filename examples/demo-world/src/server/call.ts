import {
  Logger,
  MicdropServer,
  handleError,
  waitForParams,
} from '@micdrop/server'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { toLang } from '../shared/lang'
import { WorldSession } from './WorldSession'
import { createAgent, createSTT, createTTS, firstMessage } from './providers'

/**
 * The one thing the browser gets to decide before she says a word. Anything
 * unexpected falls back to French rather than ending the call.
 */
const callParamsSchema = z.object({
  lang: z.string().optional(),
})

export default async (app: FastifyInstance) => {
  app.get('/call', { websocket: true }, async (socket) => {
    try {
      const params = await waitForParams(socket, callParamsSchema.parse)
      const lang = toLang(params.lang)

      // The session directs every answer, so the agent needs a hook towards it
      // before the session itself exists.
      let session: WorldSession | undefined
      const agent = createAgent(lang, () => session?.beforeAnswer())

      const server = new MicdropServer(socket, {
        // Written by hand so the voice starts without waiting for a generation.
        firstMessage: firstMessage(lang),
        agent,
        stt: createSTT(lang),
        tts: createTTS(lang),
      })

      // Before the session starts, so it can log what asks for an answer.
      if (process.env.DEBUG) {
        server.logger = new Logger('MicdropServer')
        agent.logger = new Logger('Planet')
      }

      session = new WorldSession(server, agent, lang)
      session.start()
    } catch (error) {
      handleError(socket, error)
    }
  })
}
