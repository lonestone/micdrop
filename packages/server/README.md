# 🖐️🎤 Micdrop: Real-Time Voice Conversations with AI

Micdrop is a set of open source Typescript packages to build real-time voice conversations with AI agents. It handles all the complexities on the browser and server side (microphone, speaker, VAD, network communication, etc) and provides ready-to-use implementations for various AI providers.

# @micdrop/server

The Node.js server implementation of [Micdrop](../../README.md).

For browser implementation, see [@micdrop/client](../client/README.md) package.

## Features

- 🤖 AI agents integration
- 🎙️ Speech-to-text and text-to-speech integration
- 🔊 Advanced audio processing:
  - Streaming input and output
  - Audio conversion
  - Interruptions handling
- 💬 Conversation state management
- 🌐 WebSocket-based audio streaming

## Installation

```bash
npm install @micdrop/server
# or
yarn add @micdrop/server
# or
pnpm add @micdrop/server
```

## Quick Start

```typescript
import { ElevenLabsTTS } from '@micdrop/elevenlabs'
import { GladiaSTT } from '@micdrop/gladia'
import { OpenaiAgent } from '@micdrop/openai'
import { MicdropServer } from '@micdrop/server'
import { WebSocketServer } from 'ws'

const wss = new WebSocketServer({ port: 8080 })

wss.on('connection', (socket) => {
  // Setup agent
  const agent = new OpenaiAgent({
    apiKey: process.env.OPENAI_API_KEY || '',
    systemPrompt: 'You are a helpful assistant',
  })

  // Setup STT
  const stt = new GladiaSTT({
    apiKey: process.env.GLADIA_API_KEY || '',
  })

  // Setup TTS
  const tts = new ElevenLabsTTS({
    apiKey: process.env.ELEVENLABS_API_KEY || '',
    voiceId: process.env.ELEVENLABS_VOICE_ID || '',
  })

  // Handle call
  new MicdropServer(socket, {
    firstMessage: 'Hello, how can I help you today?',
    agent,
    stt,
    tts,
  })
})
```

## Examples

### Authorization and Language Parameters

For production applications, you'll want to handle authorization and language configuration:

```typescript
import { ElevenLabsTTS } from '@micdrop/elevenlabs'
import { GladiaSTT } from '@micdrop/gladia'
import { OpenaiAgent } from '@micdrop/openai'
import {
  MicdropServer,
  waitForParams,
  MicdropError,
  MicdropErrorCode,
  handleError,
} from '@micdrop/server'
import { WebSocketServer } from 'ws'
import { z } from 'zod'

const wss = new WebSocketServer({ port: 8080 })

// Define params schema for authorization and language
const callParamsSchema = z.object({
  authorization: z.string(),
  lang: z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/), // e.g., "en", "fr", "en-US"
})

wss.on('connection', async (socket) => {
  try {
    // Wait for client parameters (authorization & language)
    const params = await waitForParams(socket, callParamsSchema.parse)

    // Validate authorization
    if (params.authorization !== process.env.AUTHORIZATION_KEY) {
      throw new MicdropError(
        MicdropErrorCode.Unauthorized,
        'Invalid authorization'
      )
    }

    // Setup agent with language-specific system prompt
    const agent = new OpenaiAgent({
      apiKey: process.env.OPENAI_API_KEY || '',
      systemPrompt: `You are a helpful assistant. Respond in ${params.lang} language.`,
    })

    // Setup STT with language configuration
    const stt = new GladiaSTT({
      apiKey: process.env.GLADIA_API_KEY || '',
      language: params.lang,
    })

    // Setup TTS with language configuration
    const tts = new ElevenLabsTTS({
      apiKey: process.env.ELEVENLABS_API_KEY || '',
      voiceId: process.env.ELEVENLABS_VOICE_ID || '',
      language: params.lang,
    })

    // Handle call
    new MicdropServer(socket, {
      firstMessage: 'Hello! How can I help you today?',
      agent,
      stt,
      tts,
    })
  } catch (error) {
    handleError(socket, error)
  }
})
```

### With Fastify

Using Fastify for WebSocket handling:

```typescript
import { ElevenLabsTTS } from '@micdrop/elevenlabs'
import { GladiaSTT } from '@micdrop/gladia'
import { OpenaiAgent } from '@micdrop/openai'
import { MicdropServer } from '@micdrop/server'
import Fastify from 'fastify'

const fastify = Fastify()

// Register WebSocket support
await fastify.register(import('@fastify/websocket'))

// WebSocket route for voice calls
fastify.register(async function (fastify) {
  fastify.get('/call', { websocket: true }, (socket) => {
    // Setup agent
    const agent = new OpenaiAgent({
      apiKey: process.env.OPENAI_API_KEY || '',
      systemPrompt: 'You are a helpful voice assistant',
    })

    // Setup STT
    const stt = new GladiaSTT({
      apiKey: process.env.GLADIA_API_KEY || '',
    })

    // Setup TTS
    const tts = new ElevenLabsTTS({
      apiKey: process.env.ELEVENLABS_API_KEY || '',
      voiceId: process.env.ELEVENLABS_VOICE_ID || '',
    })

    // Handle call
    new MicdropServer(socket, {
      firstMessage: 'Hello, how can I help you today?',
      agent,
      stt,
      tts,
    })
  })
})

// Start server
fastify
  .listen({ port: 8080 })
  .then(() => console.log('Server listening on port 8080'))
  .catch((err) => fastify.log.error(err))
```

### With NestJS

Using NestJS for WebSocket handling:

```typescript
// websocket.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets'
import { ElevenLabsTTS } from '@micdrop/elevenlabs'
import { GladiaSTT } from '@micdrop/gladia'
import { OpenaiAgent } from '@micdrop/openai'
import { MicdropServer } from '@micdrop/server'
import { Server } from 'ws'
import { Injectable } from '@nestjs/common'

@Injectable()
@WebSocketGateway(8080)
export class MicdropGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server

  handleConnection(socket: Server) {
    // Setup agent
    const agent = new OpenaiAgent({
      apiKey: process.env.OPENAI_API_KEY || '',
      systemPrompt: 'You are a helpful voice assistant built with NestJS',
    })

    // Setup STT
    const stt = new GladiaSTT({
      apiKey: process.env.GLADIA_API_KEY || '',
    })

    // Setup TTS
    const tts = new ElevenLabsTTS({
      apiKey: process.env.ELEVENLABS_API_KEY || '',
      voiceId: process.env.ELEVENLABS_VOICE_ID || '',
    })

    // Handle call
    new MicdropServer(socket, {
      firstMessage: 'Hello, how can I help you today?',
      agent,
      stt,
      tts,
    })
  }
}
```

```typescript
// app.module.ts
import { Module } from '@nestjs/common'
import { MicdropGateway } from './websocket.gateway'

@Module({
  providers: [MicdropGateway],
})
export class AppModule {}
```

## Agent / STT / TTS

Micdrop server has 3 main components:

- `Agent` - AI agent using LLM
- `STT` - Speech-to-text
- `TTS` - Text-to-speech

### Available implementations

Micdrop provides ready-to-use implementations for the following AI providers:

- [@micdrop/openai](../openai/README.md)
- [@micdrop/elevenlabs](../elevenlabs/README.md)
- [@micdrop/cartesia](../cartesia/README.md)
- [@micdrop/mistral](../mistral/README.md)
- [@micdrop/gladia](../gladia/README.md)

### Custom implementations

You can use provided abstractions to write your own implementation:

- **[Agent](./docs/Agent.md)** - Abstract class for answer generation
- **[STT](./docs/STT.md)** - Abstract class for speech-to-text
- **[TTS](./docs/TTS.md)** - Abstract class for text-to-speech

## Demo

Check out the demo implementation in the [@micdrop/demo-server](../../examples/demo-server/README.md) package. It shows:

- Setting up a Fastify server with WebSocket support
- Configuring the MicdropServer with custom handlers
- Basic authentication flow
- Example agent, speech-to-text and text-to-speech implementations
- Error handling patterns

## Documentation

Learn more about the protocol of Micdrop in [protocol.md](./docs/protocol.md).

## License

MIT

## Author

Originally developed for [Raconte.ai](https://www.raconte.ai) and open sourced by [Lonestone](https://www.lonestone.io) ([GitHub](https://github.com/lonestone))
