# With NestJS

Integrate Micdrop server with NestJS for enterprise-grade voice applications with dependency injection and decorators.

## Installation

```bash
npm install @micdrop/server @nestjs/websockets @nestjs/platform-ws
```

## Basic Gateway

```typescript
// micdrop.gateway.ts
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

@WebSocketGateway({ path: '/call' })
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
import { MicdropGateway } from './micdrop.gateway'

@Module({
  providers: [MicdropGateway],
})
export class AppModule {}
```
