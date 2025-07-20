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
    firstMessage: 'Hello!',
    agent,
    stt,
    tts,
  })
})
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
