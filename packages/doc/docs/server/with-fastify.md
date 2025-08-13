# With Fastify

Integrate Micdrop server with Fastify for robust web applications with voice capabilities.

## Installation

```bash
npm install @micdrop/server @fastify/websocket fastify
```

## Basic Setup

```typescript
import { MicdropServer } from '@micdrop/server'
import { OpenaiAgent } from '@micdrop/openai'
import { GladiaSTT } from '@micdrop/gladia'
import { ElevenLabsTTS } from '@micdrop/elevenlabs'
import Fastify from 'fastify'

const fastify = Fastify({ logger: true })

// Register WebSocket support
await fastify.register(import('@fastify/websocket'))

// WebSocket route for voice calls
fastify.register(async function (fastify) {
  fastify.get('/call', { websocket: true }, (connection, request) => {
    // Setup AI components
    const agent = new OpenaiAgent({
      apiKey: process.env.OPENAI_API_KEY || '',
      systemPrompt: 'You are a helpful voice assistant built with Fastify',
    })

    const stt = new GladiaSTT({
      apiKey: process.env.GLADIA_API_KEY || '',
    })

    const tts = new ElevenLabsTTS({
      apiKey: process.env.ELEVENLABS_API_KEY || '',
      voiceId: process.env.ELEVENLABS_VOICE_ID || '',
    })

    // Handle voice conversation
    new MicdropServer(connection.socket, {
      firstMessage: 'Hello from Fastify! How can I help you?',
      agent,
      stt,
      tts,
    })
  })
})

// Start server
try {
  await fastify.listen({ port: 8081, host: '0.0.0.0' })
  console.log('🎤 Fastify + Micdrop server running on http://localhost:8081')
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
```
