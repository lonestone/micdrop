# Getting Started

Get up and running with Micdrop to build real-time voice conversations with AI agents.

## Quick Setup

### Client (Browser)

Install the browser package and start capturing voice input:

```bash
npm install @micdrop/client
```

```typescript
import { Micdrop } from '@micdrop/client'

await Micdrop.start({
  url: 'ws://localhost:8080',
  vad: ['volume', 'silero']
})
```

### Server (Node.js) 

Install the server package and set up AI integrations:

```bash
npm install @micdrop/server @micdrop/openai @micdrop/elevenlabs
```

```typescript
import { MicdropServer } from '@micdrop/server'
import { OpenaiAgent } from '@micdrop/openai'
import { ElevenLabsTTS } from '@micdrop/elevenlabs'
import { WebSocketServer } from 'ws'

const wss = new WebSocketServer({ port: 8080 })

wss.on('connection', (socket) => {
  new MicdropServer(socket, {
    agent: new OpenaiAgent({ apiKey: '...' }),
    tts: new ElevenLabsTTS({ apiKey: '...' }),
    firstMessage: 'Hello! How can I help?'
  })
})
```

## Live Demos

See Micdrop in action:

- **[Demo Client](../../examples/demo-client)** - React application with full UI
- **[Demo Server](../../examples/demo-server)** - Production-ready server setup

## Next Steps

- **[Installation](./installation)** - Detailed setup instructions
- **[Quick Start](./quick-start)** - Build your first app in 5 minutes