# 🖐️🎤 Micdrop: Real-Time Voice Conversations with AI

[Micdrop website](https://micdrop.dev) | [Documentation](https://micdrop.dev/docs/server) | [Demo](../../examples/demo-server)

Micdrop is a set of open source Typescript packages to build real-time voice conversations with AI agents. It handles all the complexities on the browser and server side (microphone, speaker, VAD, network communication, etc) and provides ready-to-use implementations for various AI providers.

# @micdrop/server

The Node.js server implementation of [Micdrop](https://micdrop.dev).

For browser implementation, see [@micdrop/client](https://micdrop.dev/docs/client).

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
```

## Quick Start

```typescript
import { MicdropServer } from '@micdrop/server'
import { OpenaiAgent } from '@micdrop/openai'
import { GladiaSTT } from '@micdrop/gladia'
import { ElevenLabsTTS } from '@micdrop/elevenlabs'
import { WebSocketServer } from 'ws'

const wss = new WebSocketServer({ port: 8081 })

wss.on('connection', (socket) => {
  // Handle voice conversation
  new MicdropServer(socket, {
    firstMessage: 'How can I help you today?',

    agent: new OpenaiAgent({
      apiKey: process.env.OPENAI_API_KEY,
      systemPrompt: 'You are a helpful assistant',
    }),

    stt: new GladiaSTT({
      apiKey: process.env.GLADIA_API_KEY,
    }),

    tts: new ElevenLabsTTS({
      apiKey: process.env.ELEVENLABS_API_KEY,
      voiceId: process.env.ELEVENLABS_VOICE_ID,
    }),
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

- [@micdrop/openai](https://micdrop.dev/docs/ai-integration/provided-integrations/openai)
- [@micdrop/elevenlabs](https://micdrop.dev/docs/ai-integration/provided-integrations/elevenlabs)
- [@micdrop/cartesia](https://micdrop.dev/docs/ai-integration/provided-integrations/cartesia)
- [@micdrop/mistral](https://micdrop.dev/docs/ai-integration/provided-integrations/mistral)
- [@micdrop/gladia](https://micdrop.dev/docs/ai-integration/provided-integrations/gladia)

### Custom implementations

You can use provided abstractions to write your own implementation:

- **[Agent](https://micdrop.dev/docs/ai-integration/custom-integrations/custom-agent)** - Abstract class for answer generation
- **[STT](https://micdrop.dev/docs/ai-integration/custom-integrations/custom-stt)** - Abstract class for speech-to-text
- **[TTS](https://micdrop.dev/docs/ai-integration/custom-integrations/custom-tts)** - Abstract class for text-to-speech

## Documentation

Read full [documentation of the Micdrop server](https://micdrop.dev/docs/server) on the [website](https://micdrop.dev).

## License

MIT

## Author

Originally developed for [Raconte.ai](https://www.raconte.ai) and open sourced by [Lonestone](https://www.lonestone.io) ([GitHub](https://github.com/lonestone))
