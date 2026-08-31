import { handleError, Logger, MicdropServer } from '@micdrop/server'
import { FastifyInstance } from 'fastify'
import { checkParams } from './params'
import { createProviders, getCatalog } from './providers'
import { record } from './record'
import { createSmartTurn } from './smartTurn'
import { addTools } from './tools'

export default async (app: FastifyInstance) => {
  // Providers the client can pick from, read by the three selects of the demo
  app.get('/providers', async () => getCatalog())

  app.get('/call', { websocket: true }, async (socket) => {
    try {
      const { lang, selection, tools, smartTurn } = await checkParams(socket)

      // Build the providers picked in the client (see the providers folder)
      const { agent, stt, tts, ...call } = await createProviders(
        selection,
        lang
      )
      const off = Object.entries(call.auto)
        .filter(([, on]) => !on)
        .map(([name]) => name)
      console.log(
        `Call in ${call.lang} with ${agent.constructor.name}, ` +
          `${stt.constructor.name} and ${tts.constructor.name}` +
          (off.length ? `, without ${off.join(' and ')}` : '')
      )
      if (selection.prompt) {
        console.log('With the system prompt written in the client')
      }

      // Weigh the turns here when the client asked for it
      const turnDetector = smartTurn ? await createSmartTurn() : undefined
      if (turnDetector) {
        console.log('Turn detection on the server')
      }

      // Start call
      const server = new MicdropServer(socket, {
        // firstMessage: 'Hello!',
        generateFirstMessage: true,
        agent,
        stt,
        tts,
        turnDetector,
      })

      // Listen to End event
      server.on('End', (call) => {
        console.log('Call ended', call)
      })

      // Setup recorder
      record(server)

      // Add the tools ticked in the client
      const toolNames = addTools(server, agent, tools)
      console.log(
        toolNames.length
          ? `Tools: ${toolNames.join(', ')}`
          : 'Call without any tool'
      )

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
