import fastifyWebsocket from '@fastify/websocket'
import fastify from 'fastify'
import call from './call'

// Create fastify server
const server = fastify({
  logger: true,
})

// Register Websocket
server.register(fastifyWebsocket, {
  errorHandler(error, socket) {
    console.error(error)
    socket.close(1011)
  },
})

// Register routes
server.register(call)

async function start() {
  try {
    await server.listen({ port: 8081, host: '0.0.0.0' })
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
