# With NestJS

Integrate Micdrop server with NestJS for enterprise-grade voice applications with dependency injection and decorators.

## Installation

```bash
npm install @micdrop/server @nestjs/websockets @nestjs/platform-ws
```

## Basic Gateway

```typescript
// voice.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Logger } from '@nestjs/common'
import { MicdropServer } from '@micdrop/server'
import { OpenaiAgent } from '@micdrop/openai'
import { ElevenLabsTTS } from '@micdrop/elevenlabs'
import { Server } from 'ws'

@WebSocketGateway({ path: '/call' })
export class VoiceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private readonly logger = new Logger(VoiceGateway.name)

  handleConnection(client: any) {
    this.logger.log('Client connected for voice conversation')

    try {
      // Setup AI components
      const agent = new OpenaiAgent({
        apiKey: process.env.OPENAI_API_KEY || '',
        systemPrompt: 'You are a helpful voice assistant built with NestJS',
      })

      const tts = new ElevenLabsTTS({
        apiKey: process.env.ELEVENLABS_API_KEY || '',
        voiceId: process.env.ELEVENLABS_VOICE_ID || '',
      })

      // Handle voice conversation
      new MicdropServer(client, {
        firstMessage: 'Hello from NestJS! How can I help you today?',
        agent,
        tts,
      })
    } catch (error) {
      this.logger.error('Failed to setup voice conversation:', error)
      client.close(1011, 'Server error')
    }
  }

  handleDisconnect(client: any) {
    this.logger.log('Client disconnected from voice conversation')
  }
}
```

## Complete Service-Based Architecture

```typescript
// voice.service.ts
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MicdropServer, MicdropError, MicdropErrorCode } from '@micdrop/server'
import { OpenaiAgent } from '@micdrop/openai'
import { ElevenLabsTTS } from '@micdrop/elevenlabs'
import { GladiaSTT } from '@micdrop/gladia'

export interface VoiceCallConfig {
  userId?: string
  language?: string
  voiceId?: string
  model?: string
}

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name)

  constructor(private configService: ConfigService) {}

  async createVoiceHandler(socket: any, config: VoiceCallConfig = {}) {
    try {
      // Setup STT
      const stt = new GladiaSTT({
        apiKey: this.configService.get<string>('GLADIA_API_KEY') || '',
        language: config.language || 'en',
      })

      // Setup AI Agent
      const agent = new OpenaiAgent({
        apiKey: this.configService.get<string>('OPENAI_API_KEY') || '',
        model: config.model || 'gpt-4-turbo-preview',
        systemPrompt: this.getSystemPrompt(config.language),
      })

      // Setup TTS
      const tts = new ElevenLabsTTS({
        apiKey: this.configService.get<string>('ELEVENLABS_API_KEY') || '',
        voiceId:
          config.voiceId ||
          this.configService.get<string>('ELEVENLABS_VOICE_ID') ||
          '',
      })

      // Create voice handler
      const micdropServer = new MicdropServer(socket, {
        firstMessage: this.getWelcomeMessage(config.language),
        agent,
        stt,
        tts,
      })

      // Log messages for analytics
      agent.on('Message', (message) => {
        this.logConversationMessage(config.userId, message)
      })

      return micdropServer
    } catch (error) {
      this.logger.error('Failed to create voice handler:', error)
      throw new MicdropError(
        MicdropErrorCode.InternalServer,
        'Voice setup failed'
      )
    }
  }

  private getSystemPrompt(language = 'en'): string {
    const prompts = {
      en: 'You are a helpful voice assistant. Keep responses concise and conversational.',
      fr: 'Tu es un assistant vocal utile. Garde les réponses concises et conversationnelles.',
      es: 'Eres un asistente de voz útil. Mantén las respuestas concisas y conversacionales.',
    }
    return prompts[language] || prompts.en
  }

  private getWelcomeMessage(language = 'en'): string {
    const messages = {
      en: 'Hello! How can I help you today?',
      fr: "Bonjour ! Comment puis-je vous aider aujourd'hui ?",
      es: '¡Hola! ¿Cómo puedo ayudarte hoy?',
    }
    return messages[language] || messages.en
  }

  private logConversationMessage(userId: string | undefined, message: any) {
    this.logger.log(
      {
        userId,
        role: message.role,
        contentLength: message.content.length,
        timestamp: new Date().toISOString(),
      },
      'Conversation message'
    )
  }
}
```

```typescript
// auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class AuthService {
  constructor(private configService: ConfigService) {}

  async validateToken(
    token: string
  ): Promise<{ userId: string; language?: string }> {
    // Implement your JWT validation logic
    if (!token || !token.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid token format')
    }

    const jwt = token.replace('Bearer ', '')

    // Mock validation - replace with your JWT verification
    if (jwt === this.configService.get<string>('AUTH_TOKEN')) {
      return { userId: 'test-user', language: 'en' }
    }

    throw new UnauthorizedException('Invalid token')
  }
}
```

```typescript
// voice.gateway.ts (Updated with services)
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Logger, UseGuards } from '@nestjs/common'
import { VoiceService, VoiceCallConfig } from './voice.service'
import { AuthService } from './auth.service'
import { waitForParams } from '@micdrop/server'
import { Server } from 'ws'
import { z } from 'zod'

const callParamsSchema = z.object({
  authorization: z.string(),
  language: z.string().optional(),
  voiceId: z.string().optional(),
})

@WebSocketGateway({ path: '/call' })
export class VoiceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private readonly logger = new Logger(VoiceGateway.name)

  constructor(
    private readonly voiceService: VoiceService,
    private readonly authService: AuthService
  ) {}

  async handleConnection(client: any, request: any) {
    const clientIP = request.socket.remoteAddress
    this.logger.log(`Voice client connected from ${clientIP}`)

    try {
      // Wait for client parameters
      const params = await waitForParams(client, (data) => {
        return callParamsSchema.parse(data)
      })

      // Validate authentication
      const user = await this.authService.validateToken(params.authorization)

      // Configure voice call
      const config: VoiceCallConfig = {
        userId: user.userId,
        language: params.language || user.language,
        voiceId: params.voiceId,
      }

      // Create voice handler
      await this.voiceService.createVoiceHandler(client, config)

      this.logger.log(`Voice conversation started for user ${user.userId}`)
    } catch (error) {
      this.logger.error('Voice connection failed:', error.message)
      client.close(1008, error.message)
    }
  }

  handleDisconnect(client: any) {
    this.logger.log('Voice client disconnected')
  }
}
```

## Module Configuration

```typescript
// voice.module.ts
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { VoiceGateway } from './voice.gateway'
import { VoiceService } from './voice.service'
import { AuthService } from './auth.service'

@Module({
  imports: [ConfigModule],
  providers: [VoiceGateway, VoiceService, AuthService],
  exports: [VoiceService],
})
export class VoiceModule {}
```

```typescript
// app.module.ts
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { VoiceModule } from './voice/voice.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    VoiceModule,
  ],
})
export class AppModule {}
```

## Advanced Features with Decorators

```typescript
// decorators/voice-config.decorator.ts
import { SetMetadata } from '@nestjs/common'

export const VOICE_CONFIG_KEY = 'voice_config'
export const VoiceConfig = (config: any) =>
  SetMetadata(VOICE_CONFIG_KEY, config)
```

```typescript
// guards/voice-auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common'
import { AuthService } from '../auth.service'

@Injectable()
export class VoiceAuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient()
    const authHeader = client.handshake?.headers?.authorization

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header required')
    }

    try {
      const user = await this.authService.validateToken(authHeader)
      client.user = user
      return true
    } catch (error) {
      throw new UnauthorizedException('Invalid authorization')
    }
  }
}
```

```typescript
// Enhanced gateway with decorators
@WebSocketGateway({ path: '/call' })
@UseGuards(VoiceAuthGuard)
export class VoiceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private readonly logger = new Logger(VoiceGateway.name)

  constructor(private readonly voiceService: VoiceService) {}

  @VoiceConfig({
    systemPrompt: 'You are a customer service assistant',
    firstMessage: 'Hello! How can I help you with your account?',
  })
  async handleConnection(client: any, request: any) {
    const user = client.user // Set by VoiceAuthGuard

    await this.voiceService.createVoiceHandler(client, {
      userId: user.userId,
      language: user.language,
    })

    this.logger.log(`Voice conversation started for user ${user.userId}`)
  }
}
```

## Multiple Voice Assistants

```typescript
// assistants/customer-support.gateway.ts
@WebSocketGateway({ path: '/support' })
export class CustomerSupportGateway implements OnGatewayConnection {
  constructor(private voiceService: VoiceService) {}

  async handleConnection(client: any) {
    await this.voiceService.createVoiceHandler(client, {
      model: 'gpt-4-turbo-preview',
      systemPrompt:
        'You are a customer support specialist. Be patient and thorough.',
    })
  }
}

// assistants/sales.gateway.ts
@WebSocketGateway({ path: '/sales' })
export class SalesGateway implements OnGatewayConnection {
  constructor(private voiceService: VoiceService) {}

  async handleConnection(client: any) {
    await this.voiceService.createVoiceHandler(client, {
      model: 'gpt-4-turbo-preview',
      systemPrompt:
        'You are a friendly sales assistant. Help customers find products.',
    })
  }
}
```

## Health Checks and Monitoring

```typescript
// health/voice.health.ts
import { Injectable } from '@nestjs/common'
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class VoiceHealthIndicator extends HealthIndicator {
  constructor(private configService: ConfigService) {
    super()
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const requiredEnvVars = [
      'OPENAI_API_KEY',
      'ELEVENLABS_API_KEY',
      'ELEVENLABS_VOICE_ID',
    ]

    const missingVars = requiredEnvVars.filter(
      (varName) => !this.configService.get(varName)
    )

    const isHealthy = missingVars.length === 0

    const result = this.getStatus(key, isHealthy, {
      missingEnvVars: missingVars,
    })

    if (isHealthy) {
      return result
    }
    throw new HealthCheckError('Voice service configuration incomplete', result)
  }
}
```

```typescript
// health/health.controller.ts
import { Controller, Get } from '@nestjs/common'
import { HealthCheck, HealthCheckService } from '@nestjs/terminus'
import { VoiceHealthIndicator } from './voice.health'

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private voiceHealthIndicator: VoiceHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.voiceHealthIndicator.isHealthy('voice'),
    ])
  }
}
```

## Production Setup

```typescript
// main.ts
import { NestFactory } from '@nestjs/core'
import { WsAdapter } from '@nestjs/platform-ws'
import { Logger } from '@nestjs/common'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn'],
  })

  // Use WebSocket adapter
  app.useWebSocketAdapter(new WsAdapter(app))

  // Enable CORS for production
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || true,
    credentials: true,
  })

  const port = process.env.PORT || 8081
  await app.listen(port, '0.0.0.0')

  Logger.log(`🎤 NestJS + Micdrop server running on port ${port}`, 'Bootstrap')
}

bootstrap()
```

## Testing

```typescript
// voice.gateway.spec.ts
import { Test, TestingModule } from '@nestjs/testing'
import { VoiceGateway } from './voice.gateway'
import { VoiceService } from './voice.service'
import { AuthService } from './auth.service'
import { ConfigService } from '@nestjs/config'

describe('VoiceGateway', () => {
  let gateway: VoiceGateway

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VoiceGateway,
        {
          provide: VoiceService,
          useValue: {
            createVoiceHandler: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            validateToken: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile()

    gateway = module.get<VoiceGateway>(VoiceGateway)
  })

  it('should be defined', () => {
    expect(gateway).toBeDefined()
  })
})
```

## Next Steps

- **[Auth and Parameters](./auth-and-parameters)** - Authentication and parameter handling
- **[Error Handling](./error-handling)** - Comprehensive error management
- **[AI Integrations](../ai-integration)** - Configure AI providers
