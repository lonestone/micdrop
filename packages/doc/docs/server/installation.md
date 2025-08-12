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
npm install @micdrop/server @micdrop/openai @micdrop/elevenlabs ws @types/ws
```

### 2. Create Server

```typescript
import { MicdropServer } from '@micdrop/server'
import { OpenaiAgent } from '@micdrop/openai'
import { ElevenLabsTTS } from '@micdrop/elevenlabs'
import { WebSocketServer } from 'ws'

const wss = new WebSocketServer({ port: 8081 })

wss.on('connection', (socket) => {
  console.log('New client connected')

  // Setup AI components
  const agent = new OpenaiAgent({
    apiKey: process.env.OPENAI_API_KEY || '',
    systemPrompt: 'You are a helpful voice assistant. Keep responses concise.',
  })

  const tts = new ElevenLabsTTS({
    apiKey: process.env.ELEVENLABS_API_KEY || '',
    voiceId: process.env.ELEVENLABS_VOICE_ID || '',
  })

  // Create voice conversation handler
  new MicdropServer(socket, {
    firstMessage: 'Hello! How can I help you today?',
    agent,
    tts,
  })
})

console.log('🎤 Micdrop server running on ws://localhost:8081')
```

### 3. Environment Setup

Create a `.env` file:

```bash
# Required: OpenAI API key
OPENAI_API_KEY=your_openai_api_key_here

# Required: ElevenLabs API key and voice ID
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_VOICE_ID=your_preferred_voice_id

# Optional: Other provider keys
GLADIA_API_KEY=your_gladia_api_key_here
CARTESIA_API_KEY=your_cartesia_api_key_here
MISTRAL_API_KEY=your_mistral_api_key_here
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

## Full Example with All Components

Complete server with speech-to-text, AI agent, and text-to-speech:

```typescript
import { MicdropServer } from '@micdrop/server'
import { OpenaiAgent } from '@micdrop/openai'
import { ElevenLabsTTS } from '@micdrop/elevenlabs'
import { GladiaSTT } from '@micdrop/gladia'
import { WebSocketServer } from 'ws'

const wss = new WebSocketServer({ port: 8081 })

wss.on('connection', (socket, request) => {
  const clientIP = request.socket.remoteAddress
  console.log(`Client connected from ${clientIP}`)

  try {
    // Setup speech-to-text
    const stt = new GladiaSTT({
      apiKey: process.env.GLADIA_API_KEY || '',
      language: 'en', // Auto-detect or specify language
    })

    // Setup AI agent
    const agent = new OpenaiAgent({
      apiKey: process.env.OPENAI_API_KEY || '',
      model: 'gpt-4-turbo-preview',
      systemPrompt: `You are a helpful voice assistant. 
        Keep responses concise and conversational.
        The user is speaking to you via voice, so respond naturally.`,
    })

    // Setup text-to-speech
    const tts = new ElevenLabsTTS({
      apiKey: process.env.ELEVENLABS_API_KEY || '',
      voiceId: process.env.ELEVENLABS_VOICE_ID || '',
      model: 'eleven_turbo_v2', // Fast model for real-time
      stability: 0.5,
      similarityBoost: 0.75,
    })

    // Create conversation handler
    const micdropServer = new MicdropServer(socket, {
      firstMessage:
        "Hello! I'm your voice assistant. How can I help you today?",
      agent,
      stt,
      tts,
      generateFirstMessage: false, // Use static first message
    })

    // Optional: Listen for conversation events
    agent.on('Message', (message) => {
      console.log('Conversation message:', message)
      // Save to database, log, etc.
    })
  } catch (error) {
    console.error('Error setting up client connection:', error)
    socket.close(1011, 'Server error during setup')
  }
})

// Handle server errors
wss.on('error', (error) => {
  console.error('WebSocket server error:', error)
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...')
  wss.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

console.log('🎤 Micdrop server running on ws://localhost:8081')
```

## Directory Structure

Organize your server project:

```
my-voice-server/
├── src/
│   ├── server.ts              # Main server file
│   ├── config/
│   │   └── env.ts            # Environment configuration
│   ├── services/
│   │   └── conversation.ts   # Conversation management
│   └── utils/
│       └── logger.ts         # Logging utilities
├── package.json
├── tsconfig.json
├── .env
└── .env.example
```

### Configuration Management

```typescript
// src/config/env.ts
export const config = {
  server: {
    port: parseInt(process.env.PORT || '8081'),
    host: process.env.HOST || 'localhost',
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
  },

  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY || '',
    voiceId: process.env.ELEVENLABS_VOICE_ID || '',
    model: process.env.ELEVENLABS_MODEL || 'eleven_turbo_v2',
  },

  gladia: {
    apiKey: process.env.GLADIA_API_KEY || '',
    language: process.env.GLADIA_LANGUAGE || 'en',
  },
}

// Validate required environment variables
const requiredVars = [
  'OPENAI_API_KEY',
  'ELEVENLABS_API_KEY',
  'ELEVENLABS_VOICE_ID',
]

for (const envVar of requiredVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}
```

### Logging Setup

```typescript
// src/utils/logger.ts
export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args)
  },

  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error)
  },

  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args)
  },

  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args)
    }
  },
}
```

## TypeScript Configuration

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Package.json Scripts

Add useful scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "start:dev": "tsx src/server.ts",
    "lint": "eslint src/**/*.ts",
    "type-check": "tsc --noEmit"
  }
}
```

## Docker Support

Optional Docker setup:

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY dist/ ./dist/

# Expose port
EXPOSE 8081

# Start server
CMD ["node", "dist/server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  voice-server:
    build: .
    ports:
      - '8081:8081'
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY}
      - ELEVENLABS_VOICE_ID=${ELEVENLABS_VOICE_ID}
    restart: unless-stopped
```

## Testing Your Server

Test the server with a simple client:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Test Micdrop Server</title>
  </head>
  <body>
    <button id="startBtn">Start Voice Chat</button>
    <div id="status">Click start to begin</div>

    <script type="module">
      import { Micdrop } from 'https://unpkg.com/@micdrop/client@latest/dist/index.js'

      document
        .getElementById('startBtn')
        .addEventListener('click', async () => {
          try {
            await Micdrop.start({
              url: 'ws://localhost:8081',
              debugLog: true,
            })
            document.getElementById('status').textContent =
              'Connected! Start speaking...'
          } catch (error) {
            document.getElementById('status').textContent =
              'Error: ' + error.message
          }
        })
    </script>
  </body>
</html>
```

## Next Steps

- **[With Fastify](./with-fastify)** - Integrate with Fastify framework
- **[With NestJS](./with-nestjs)** - Integrate with NestJS framework
- **[Auth and Parameters](./auth-and-parameters)** - Add authentication and user parameters
