# Server (Node.js)

Micdrop server orchestrates voice conversations by integrating AI agents, speech-to-text, and text-to-speech services with WebSocket communication.

## Installation

```bash
npm install @micdrop/server
```

See [Installation](./installation) for more details.

## Quick Example

```typescript
import { MicdropServer } from '@micdrop/server'
import { WebSocketServer } from 'ws'

const wss = new WebSocketServer({ port: 8081 })

wss.on('connection', (socket) => {
  new MicdropServer(socket, {
    firstMessage: 'Hello! How can I help you today?',
    agent: new OpenaiAgent({ apiKey: '...' }),
    stt: new GladiaSTT({ apiKey: '...' }),
    tts: new ElevenLabsTTS({ apiKey: '...', voiceId: '...' }),
  })
})
```

## Features

- 🤖 **AI Agent Integration** - Support for OpenAI, Mistral, and custom LLMs
- 🎙️ **Speech-to-Text** - Gladia, OpenAI Whisper, and custom STT implementations
- 🔊 **Text-to-Speech** - ElevenLabs, Cartesia, and custom TTS implementations
- 🌐 **WebSocket Communication** - Real-time audio streaming with clients
- 💬 **Conversation Management** - Message history and state tracking
- 🔄 **Streaming Support** - Real-time response generation and audio streaming
- 🛡️ **Error Handling** - Comprehensive error management and recovery

## Architecture

```
Client (Browser) ←→ MicdropServer ←→ AI Components
                        ├── Agent (LLM)
                        ├── STT (Speech-to-Text)
                        └── TTS (Text-to-Speech)
```

The server acts as the orchestrator, handling:

1. **Audio Reception** - Receives audio chunks from clients
2. **Speech Recognition** - Converts audio to text using STT
3. **AI Processing** - Generates responses using AI agents
4. **Speech Synthesis** - Converts responses to audio using TTS
5. **Audio Streaming** - Sends audio back to clients

## Core Components

- **[MicdropServer](./micdrop-server)** - Main server class for conversation orchestration
- **[Agent](../ai-integration/custom-integrations/custom-agent)** - AI agent base class and implementations
- **[STT](../ai-integration/custom-integrations/custom-stt)** - Speech-to-text base class and implementations
- **[TTS](../ai-integration/custom-integrations/custom-tts)** - Text-to-speech base class and implementations

## Quick Examples

### Basic Setup

```typescript
import { MicdropServer } from '@micdrop/server'
import { OpenaiAgent } from '@micdrop/openai'

new MicdropServer(socket, {
  agent: new OpenaiAgent({ apiKey: process.env.OPENAI_API_KEY }),
  firstMessage: 'Hi there!',
})
```

### With All Components

```typescript
new MicdropServer(socket, {
  agent: new OpenaiAgent({ apiKey: process.env.OPENAI_API_KEY }),
  stt: new GladiaSTT({ apiKey: process.env.GLADIA_API_KEY }),
  tts: new ElevenLabsTTS({ apiKey: process.env.ELEVENLABS_API_KEY }),
  firstMessage: 'Welcome to our voice assistant!',
})
```

### Framework Integrations

- **[WebSocket Server](./installation)** - Basic Node.js setup
- **[With Fastify](./with-fastify)** - Fastify framework integration
- **[With NestJS](./with-nestjs)** - NestJS framework integration

## Next Steps

- **[Installation](./installation)** - Set up your first voice server
- **[Authentication](./auth-and-parameters)** - Handle user authentication and parameters
- **[AI Integrations](../ai-integration)** - Choose and configure AI providers
