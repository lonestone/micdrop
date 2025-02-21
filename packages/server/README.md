# @micdrop/server

A Node.js library for handling real-time voice conversations with WebSocket-based audio streaming.

For browser implementation, see [@micdrop/client](../client/README.md) package.

## Features

- 🌐 WebSocket server for real-time audio streaming
- 🔊 Audio data handling and processing
- 💬 Conversation state management
- ⚡ Event-based architecture
- 🔄 Bi-directional communication
- 🛡️ Built-in error handling
- 🎙️ Speech-to-text and text-to-speech integration
- 🤖 AI conversation generation support
- 💾 Debug mode with optional audio saving

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
import { WebSocketServer } from 'ws'
import { CallSocket, CallConfig } from '@micdrop/server'

// Create WebSocket server
const wss = new WebSocketServer({ port: 8080 })

// Define call configuration
const config: CallConfig = {
  // Initial system prompt for the conversation
  systemPrompt: 'You are a helpful assistant',

  // Optional first message from assistant
  firstMessage: 'Hello!',

  // Function to generate assistant responses
  async generateAnswer(conversation) {
    // Implement your LLM or response generation logic
    return 'Assistant response'
  },

  // Function to convert speech to text
  async speech2Text(audioBlob, lastMessagePrompt) {
    // Implement your STT logic
    return 'Transcribed text'
  },

  // Function to convert text to speech
  async text2Speech(text) {
    // Implement your TTS logic
    return new ArrayBuffer(0) // Audio data
  },

  // Optional callback when a message is added
  onMessage(message) {
    console.log('New message:', message)
  },

  // Optional callback when call ends
  onEnd(summary) {
    console.log('Call ended:', summary)
  },
}

// Handle new connections
wss.on('connection', (ws) => {
  // Create call handler with configuration
  new CallSocket(ws, config)
})
```

## Documentation

The server package provides several core components:

- **CallSocket** - Main class that handles WebSocket connections, audio streaming, and conversation flow
- **CallConfig** - Configuration interface for customizing speech processing and conversation behavior
- **Types** - Common TypeScript types and interfaces for messages and commands
- **Error Handling** - Standardized error handling with specific error codes

## API Reference

### CallSocket

The main class for managing WebSocket connections and audio streaming.

```typescript
class CallSocket {
  constructor(socket: WebSocket, config: CallConfig)
}
```

### CallConfig

Configuration interface for customizing the call behavior.

```typescript
interface CallConfig {
  // Initial system prompt for the conversation
  systemPrompt: string

  // Optional first message from assistant
  firstMessage?: string

  // Generate assistant's response
  generateAnswer(conversation: Conversation): Promise<string>

  // Convert audio to text
  speech2Text(blob: Blob, prompt?: string): Promise<string>

  // Convert text to audio
  text2Speech(text: string): Promise<ArrayBuffer>

  // Optional callbacks
  onMessage?(message: ConversationMessage): void
  onEnd?(summary: CallSummary): void
}
```

### Message Types

```typescript
interface ConversationMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type Conversation = ConversationMessage[]

interface CallSummary {
  conversation: Conversation
  duration: number
}
```

## WebSocket Protocol

The server implements a specific protocol for client-server communication:

### Client Commands

```typescript
enum CallClientCommands {
  StartSpeaking = 'startSpeaking',
  StopSpeaking = 'stopSpeaking',
  Mute = 'mute',
}
```

### Server Commands

```typescript
enum CallServerCommands {
  UserMessage = 'userMessage',
  AssistantMessage = 'assistantMessage',
  CancelLastAssistantMessage = 'cancelLastAssistantMessage',
  EndInterview = 'endInterview',
}
```

### Message Flow

1. Client connects to WebSocket server
2. Server sends initial assistant message (if configured)
3. Client sends audio chunks when user speaks
4. Server processes audio and responds with text/audio
5. Process continues until interview ends

## Error Handling

The server implements standardized error handling with specific codes:

```typescript
enum CallErrorCode {
  BadRequest = 4400,
  Unauthorized = 4401,
  NotFound = 4404,
}
```

Common error scenarios:

- Invalid WebSocket messages
- Authentication failures
- Missing or invalid parameters
- Audio processing errors
- Connection timeouts

## Integration Example

Here's an example using Fastify:

```typescript
import fastify from 'fastify'
import fastifyWebsocket from '@fastify/websocket'
import { CallSocket, CallConfig } from '@micdrop/server'

const server = fastify()
server.register(fastifyWebsocket)

server.get('/call', { websocket: true }, (socket) => {
  const config: CallConfig = {
    systemPrompt: 'You are a helpful assistant',
    // ... other config options
  }
  new CallSocket(socket, config)
})

server.listen({ port: 8080 })
```

## Debug Mode

The server includes a debug mode that can:

- Log detailed timing information
- Save audio files for debugging (optional)
- Track conversation state
- Monitor WebSocket events

## Browser Support

The server is designed to work with any WebSocket client, but is specifically tested with:

- Modern browsers supporting WebSocket API
- Node.js clients
- @micdrop/client package

## License

MIT

## Author

[Lonestone](https://www.lonestone.io) ([GitHub](https://github.com/lonestone))
