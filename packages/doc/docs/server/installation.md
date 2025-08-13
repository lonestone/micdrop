# Installation

Set up Micdrop server with WebSocket support for real-time voice conversations.

## Package Installation

```bash
npm install @micdrop/server
```

## Basic WebSocket Server

Create a simple voice server using the Node.js WebSocket library:

### 1. Install Dependencies

```bash
# Install Micdrop server and WebSocket
npm install @micdrop/server ws
npm install -D @types/ws

# Install AI providers
npm install @micdrop/openai @micdrop/gladia @micdrop/elevenlabs
```

### 2. Create `server.ts`

```typescript
import { ElevenLabsTTS } from '@micdrop/elevenlabs'
import { GladiaSTT } from '@micdrop/gladia'
import { OpenaiAgent } from '@micdrop/openai'
import { MicdropServer } from '@micdrop/server'
import { WebSocketServer } from 'ws'

const wss = new WebSocketServer({ port: 8081 })

wss.on('connection', (socket) => {
  // Setup AI components
  const agent = new OpenaiAgent({
    apiKey: process.env.OPENAI_API_KEY || '',
    systemPrompt: 'You are a helpful voice assistant. Keep responses concise.',
  })

  const stt = new GladiaSTT({
    apiKey: process.env.GLADIA_API_KEY || '',
  })

  const tts = new ElevenLabsTTS({
    apiKey: process.env.ELEVENLABS_API_KEY || '',
    voiceId: process.env.ELEVENLABS_VOICE_ID || '',
  })

  // Create voice conversation handler
  new MicdropServer(socket, {
    firstMessage: 'Hello! How can I help you today?',
    agent,
    stt,
    tts,
  })
})

console.log('🎤 Micdrop server running on ws://localhost:8081')
```

Of course you can use any other providers, see [AI Integrations](../ai-integration) for more details.

### 3. Environment Setup

Create a `.env` file:

```bash
OPENAI_API_KEY=your_openai_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_VOICE_ID=your_preferred_voice_id
GLADIA_API_KEY=your_gladia_api_key_here
```

### 4. Run Server

```bash
# Install tsx for TypeScript execution
npm install -g tsx

# Run the server
tsx server.ts

# Or compile and run
npx tsc server.ts
node server.js
```
