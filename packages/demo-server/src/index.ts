// Load environment variables before importing anything else
import * as dotenv from 'dotenv'
dotenv.config()

import fastifyWebsocket from '@fastify/websocket'
import fastify from 'fastify'
import call from './call'

const PORT = process.env.PORT || 8081

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
    await server.listen({ port: Number(PORT), host: '0.0.0.0' })
    console.log(`Server is running on port ${PORT}`)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
