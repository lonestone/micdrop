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

    const tts = new ElevenLabsTTS({
      apiKey: process.env.ELEVENLABS_API_KEY || '',
      voiceId: process.env.ELEVENLABS_VOICE_ID || '',
    })

    // Handle voice conversation
    new MicdropServer(connection.socket, {
      firstMessage: 'Hello from Fastify! How can I help you?',
      agent,
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

## Complete Example with Authentication

```typescript
import {
  MicdropServer,
  waitForParams,
  MicdropError,
  MicdropErrorCode,
} from '@micdrop/server'
import { OpenaiAgent } from '@micdrop/openai'
import { ElevenLabsTTS } from '@micdrop/elevenlabs'
import { GladiaSTT } from '@micdrop/gladia'
import Fastify from 'fastify'
import { z } from 'zod'

const fastify = Fastify({
  logger: {
    level: 'info',
    prettyPrint: process.env.NODE_ENV !== 'production',
  },
})

// Register plugins
await fastify.register(import('@fastify/websocket'))
await fastify.register(import('@fastify/cors'), {
  origin: process.env.CORS_ORIGIN || true,
})

// Validation schema for client parameters
const callParamsSchema = z.object({
  authorization: z.string().min(1),
  language: z
    .string()
    .regex(/^[a-z]{2}(-[A-Z]{2})?$/)
    .optional(),
  userId: z.string().optional(),
})

// REST API routes
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

// Voice call WebSocket endpoint
fastify.register(async function (fastify) {
  fastify.get('/call', { websocket: true }, async (connection, request) => {
    const socket = connection.socket

    try {
      // Wait for client parameters with timeout
      const params = await waitForParams(
        socket,
        (data) => {
          return callParamsSchema.parse(data)
        },
        5000
      )

      // Validate authorization
      const isAuthorized = await validateAuth(params.authorization)
      if (!isAuthorized) {
        throw new MicdropError(
          MicdropErrorCode.Unauthorized,
          'Invalid authorization token'
        )
      }

      // Get user preferences
      const userConfig = await getUserConfig(params.userId)
      const language = params.language || userConfig.language || 'en'

      fastify.log.info(
        { userId: params.userId, language },
        'Voice call started'
      )

      // Setup AI components with user configuration
      const agent = new OpenaiAgent({
        apiKey: process.env.OPENAI_API_KEY || '',
        model: userConfig.preferredModel || 'gpt-4-turbo-preview',
        systemPrompt: getSystemPrompt(language, userConfig),
      })

      const stt = new GladiaSTT({
        apiKey: process.env.GLADIA_API_KEY || '',
        language: language,
      })

      const tts = new ElevenLabsTTS({
        apiKey: process.env.ELEVENLABS_API_KEY || '',
        voiceId: userConfig.voiceId || process.env.ELEVENLABS_VOICE_ID || '',
        stability: userConfig.voiceStability || 0.5,
      })

      // Create conversation handler
      const micdropServer = new MicdropServer(socket, {
        firstMessage: getWelcomeMessage(language),
        agent,
        stt,
        tts,
      })

      // Log conversation messages
      agent.on('Message', (message) => {
        fastify.log.info(
          {
            userId: params.userId,
            role: message.role,
            content: message.content.substring(0, 100) + '...',
          },
          'Conversation message'
        )
      })
    } catch (error) {
      fastify.log.error({ error: error.message }, 'Voice call setup failed')

      if (error instanceof MicdropError) {
        socket.close(1008, error.message)
      } else {
        socket.close(1011, 'Internal server error')
      }
    }
  })
})

// Helper functions
async function validateAuth(token: string): Promise<boolean> {
  // Implement your authentication logic
  // This could check JWT tokens, API keys, database, etc.
  return token === process.env.AUTH_TOKEN || token.startsWith('Bearer ')
}

async function getUserConfig(userId?: string) {
  // Fetch user configuration from database
  // This is a mock implementation
  return {
    language: 'en',
    preferredModel: 'gpt-4-turbo-preview',
    voiceId: process.env.ELEVENLABS_VOICE_ID,
    voiceStability: 0.5,
  }
}

function getSystemPrompt(language: string, userConfig: any): string {
  const prompts = {
    en: 'You are a helpful voice assistant. Keep responses concise and natural.',
    fr: 'Tu es un assistant vocal utile. Garde les réponses concises et naturelles.',
    es: 'Eres un asistente de voz útil. Mantén las respuestas concisas y naturales.',
  }

  return prompts[language] || prompts.en
}

function getWelcomeMessage(language: string): string {
  const messages = {
    en: 'Hello! How can I help you today?',
    fr: "Bonjour ! Comment puis-je vous aider aujourd'hui ?",
    es: '¡Hola! ¿Cómo puedo ayudarte hoy?',
  }

  return messages[language] || messages.en
}

// Error handling
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error)
  reply.status(500).send({ error: 'Internal Server Error' })
})

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM']
signals.forEach((signal) => {
  process.on(signal, async () => {
    fastify.log.info('Shutting down server...')
    await fastify.close()
    process.exit(0)
  })
})

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '8081')
    const host = process.env.HOST || '0.0.0.0'

    await fastify.listen({ port, host })
    console.log(`🎤 Fastify + Micdrop server running on http://${host}:${port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
```

## Plugin Architecture

Create reusable Fastify plugins:

```typescript
// plugins/micdrop.ts
import { FastifyPluginAsync } from 'fastify'
import { MicdropServer } from '@micdrop/server'

interface MicdropPluginOptions {
  agentConfig: any
  sttConfig?: any
  ttsConfig?: any
}

const micdropPlugin: FastifyPluginAsync<MicdropPluginOptions> = async (
  fastify,
  options
) => {
  // Register WebSocket support if not already registered
  if (!fastify.hasPlugin('@fastify/websocket')) {
    await fastify.register(import('@fastify/websocket'))
  }

  // Add Micdrop utilities to Fastify instance
  fastify.decorate('createVoiceHandler', (socket, userConfig = {}) => {
    const { agentConfig, sttConfig, ttsConfig } = options

    // Create AI components with user configuration
    const agent = createAgent({ ...agentConfig, ...userConfig.agent })
    const stt = sttConfig
      ? createSTT({ ...sttConfig, ...userConfig.stt })
      : undefined
    const tts = ttsConfig
      ? createTTS({ ...ttsConfig, ...userConfig.tts })
      : undefined

    return new MicdropServer(socket, {
      firstMessage: userConfig.firstMessage || 'Hello!',
      agent,
      stt,
      tts,
    })
  })
}

export default micdropPlugin
```

Use the plugin:

```typescript
import micdropPlugin from './plugins/micdrop'

await fastify.register(micdropPlugin, {
  agentConfig: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4-turbo-preview',
  },
  ttsConfig: {
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: process.env.ELEVENLABS_VOICE_ID,
  },
})

// Use the plugin
fastify.get('/call', { websocket: true }, (connection) => {
  fastify.createVoiceHandler(connection.socket, {
    firstMessage: 'Welcome to our service!',
  })
})
```

## Multiple Voice Endpoints

Support different voice assistants on different routes:

```typescript
// Customer support assistant
fastify.register(async function (fastify) {
  fastify.get('/support', { websocket: true }, (connection) => {
    const agent = new OpenaiAgent({
      apiKey: process.env.OPENAI_API_KEY,
      systemPrompt:
        'You are a customer support agent. Be helpful and professional.',
    })

    new MicdropServer(connection.socket, {
      agent,
      firstMessage: "Hello! I'm here to help with any questions or issues.",
    })
  })
})

// Sales assistant
fastify.register(async function (fastify) {
  fastify.get('/sales', { websocket: true }, (connection) => {
    const agent = new OpenaiAgent({
      apiKey: process.env.OPENAI_API_KEY,
      systemPrompt:
        'You are a friendly sales assistant. Help customers find what they need.',
    })

    new MicdropServer(connection.socket, {
      agent,
      firstMessage:
        'Hi! I can help you find the perfect product for your needs.',
    })
  })
})

// Technical support
fastify.register(async function (fastify) {
  fastify.get('/tech-support', { websocket: true }, (connection) => {
    const agent = new OpenaiAgent({
      apiKey: process.env.OPENAI_API_KEY,
      systemPrompt:
        'You are a technical support specialist. Provide clear, step-by-step guidance.',
    })

    new MicdropServer(connection.socket, {
      agent,
      firstMessage:
        "Hello! I'm here to help with any technical issues you're experiencing.",
    })
  })
})
```

## Production Configuration

Environment-specific configurations:

```typescript
// config/server.ts
const config = {
  development: {
    logger: {
      level: 'debug',
      prettyPrint: true,
    },
    cors: {
      origin: true,
    },
  },

  production: {
    logger: {
      level: 'info',
      prettyPrint: false,
    },
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || false,
    },
    trustProxy: true,
  },

  test: {
    logger: false,
    cors: {
      origin: true,
    },
  },
}

const env = process.env.NODE_ENV || 'development'
export default config[env]
```

## Rate Limiting

Add rate limiting for voice calls:

```typescript
import rateLimit from '@fastify/rate-limit'

await fastify.register(rateLimit, {
  max: 10, // 10 requests
  timeWindow: 60000, // per minute
  keyGenerator: (request) => {
    // Rate limit by IP or user ID
    return request.ip || request.headers['x-user-id'] || 'anonymous'
  },
})

// Apply rate limiting to voice endpoints
fastify.get(
  '/call',
  {
    websocket: true,
    config: {
      rateLimit: {
        max: 5, // 5 concurrent calls per minute
        timeWindow: 60000,
      },
    },
  },
  (connection) => {
    // Handle voice call
  }
)
```

## Monitoring and Metrics

Add monitoring capabilities:

```typescript
import fastifyMetrics from 'fastify-metrics'

await fastify.register(fastifyMetrics, {
  endpoint: '/metrics',
})

// Custom metrics for voice calls
const callDuration = new fastify.metrics.client.Histogram({
  name: 'voice_call_duration_seconds',
  help: 'Duration of voice calls',
  labelNames: ['status', 'language'],
})

const activeConnections = new fastify.metrics.client.Gauge({
  name: 'active_voice_connections',
  help: 'Number of active voice connections',
})

fastify.get('/call', { websocket: true }, (connection) => {
  const startTime = Date.now()
  activeConnections.inc()

  connection.socket.on('close', () => {
    const duration = (Date.now() - startTime) / 1000
    callDuration.observe({ status: 'completed' }, duration)
    activeConnections.dec()
  })

  // Setup voice handler...
})
```

## Next Steps

- **[With NestJS](./with-nestjs)** - NestJS framework integration
- **[Auth and Parameters](./auth-and-parameters)** - Authentication and user management
- **[Error Handling](./error-handling)** - Comprehensive error management
