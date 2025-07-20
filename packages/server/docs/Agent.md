# Agent

The `Agent` class is the core abstraction for AI conversation handling in Micdrop. It provides a standardized interface for integrating various AI providers into real-time voice conversations.

## Available Implementations

- [OpenaiAgent](../../openai/src/OpenaiAgent.ts) from [@micdrop/openai](../../openai/README.md)
- [MistralAgent](../../mistral/src/MistralAgent.ts) from [@micdrop/mistral](../../mistral/README.md)
- [MockAgent](../src/agent/MockAgent.ts) for testing

## Overview

The `Agent` class is an abstract base class that extends `EventEmitter` and manages:

- Conversation history with role-based messages (system, user, assistant)
- Streaming response generation
- Event emission for conversation state changes
- Cancellation and cleanup mechanisms
- Integration with logging systems

```typescript
export abstract class Agent<Options extends AgentOptions = AgentOptions> extends EventEmitter {
  public logger?: Logger
  public conversation: MicdropConversation

  constructor(protected options: Options)

  // Generate a streaming response based on the conversation history
  abstract answer(): Readable

  // Cancel the current answer generation process
  abstract cancel(): void
}
```

## Architecture

### Core Interfaces

```typescript
export interface AgentOptions {
  systemPrompt: string
}

export interface AgentEvents {
  Message: [MicdropConversationMessage]
  CancelLastUserMessage: []
  CancelLastAssistantMessage: []
  SkipAnswer: []
  EndCall: []
}

export interface MicdropConversationMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  metadata?: any
}
```

### Conversation Management

The Agent maintains a conversation history as an array of messages:

```typescript
public conversation: MicdropConversation
```

The conversation is initialized with the system prompt:

```typescript
constructor(protected options: Options) {
  super()
  this.conversation = [{ role: 'system', content: options.systemPrompt }]
}
```

## Abstract Methods

### `answer(): Readable`

Generates a streaming response based on the current conversation history. Must return a `Readable` stream that emits text chunks.

**Implementation Requirements:**

- Return a `Readable` stream that outputs text chunks
- Handle cancellation via the `cancel()` method
- Add the complete response to conversation history when finished
- Emit appropriate events during processing

### `cancel(): void`

Cancels the current answer generation process. Should:

- Abort any ongoing API requests
- Clean up resources
- Stop the answer stream

## Public Methods

### `addUserMessage(text: string)`

Adds a user message to the conversation history.

```typescript
agent.addUserMessage('Hello, how are you?')
```

### `addAssistantMessage(text: string)`

Adds an assistant message to the conversation history.

```typescript
agent.addAssistantMessage("I'm doing well, thank you!")
```

### `destroy()`

Cleans up the agent instance:

- Removes all event listeners
- Calls `cancel()` to stop ongoing operations
- Logs destruction

```typescript
agent.destroy()
```

## Events

The Agent emits the following events:

### `Message`

Emitted when a new message is added to the conversation.

```typescript
agent.on('Message', (message: MicdropConversationMessage) => {
  console.log(`New ${message.role} message: ${message.content}`)
})
```

### `CancelLastUserMessage`

Emitted when the last user message is cancelled.

```typescript
agent.on('CancelLastUserMessage', () => {
  console.log('Last user message was cancelled')
})
```

### `CancelLastAssistantMessage`

Emitted when the last assistant message is cancelled.

```typescript
agent.on('CancelLastAssistantMessage', () => {
  console.log('Last assistant message was cancelled')
})
```

### `SkipAnswer`

Emitted when the agent decides to skip answering.

```typescript
agent.on('SkipAnswer', () => {
  console.log('Agent skipped answering')
})
```

### `EndCall`

Emitted when the agent determines the call should end.

```typescript
agent.on('EndCall', () => {
  console.log('Call should end')
})
```

## Debug Logging

Enable detailed logging for development:

```typescript
// Enable debug logging
agent.logger = new Logger('CustomAgent')
```

## Custom Agent Implementation

### Creating a Custom Agent Implementation

```typescript
import { Agent, AgentOptions } from '@micdrop/server'
import { PassThrough, Readable } from 'stream'

interface CustomAgentOptions extends AgentOptions {
  apiKey: string
  model?: string
}

class CustomAgent extends Agent<CustomAgentOptions> {
  private currentStream?: Readable

  constructor(options: CustomAgentOptions) {
    super(options)
  }

  answer(): Readable {
    // Create a readable stream for the response
    const stream = new PassThrough()

    this.currentStream = stream

    // Start generating response asynchronously
    this.generateResponse(stream)

    return stream
  }

  private async generateResponse(stream: Readable) {
    try {
      // Build messages for your AI provider
      const messages = this.conversation.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      // Make API call to your AI provider
      const response = await fetch('https://api.your-provider.com/chat', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          model: this.options.model || 'default-model',
          stream: true,
        }),
      })

      const reader = response.body?.getReader()
      let fullResponse = ''

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        // Parse streaming response (format depends on your provider)
        const chunk = new TextDecoder().decode(value)
        const text = this.parseChunk(chunk)

        if (text) {
          fullResponse += text
          stream.push(text)
        }
      }

      // Add complete response to conversation
      this.addAssistantMessage(fullResponse)

      stream.push(null) // End stream
    } catch (error) {
      this.logger?.error('Error generating response:', error)
      stream.destroy(error as Error)
    }
  }

  private parseChunk(chunk: string): string {
    // Parse your provider's streaming format
    // This is just an example - format varies by provider
    try {
      const lines = chunk.split('\n').filter((line) => line.trim())
      let text = ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6))
          if (data.choices?.[0]?.delta?.content) {
            text += data.choices[0].delta.content
          }
        }
      }

      return text
    } catch {
      return ''
    }
  }

  cancel(): void {
    if (this.currentStream) {
      this.currentStream.destroy()
      this.currentStream = undefined
    }
    this.logger?.debug('Answer generation cancelled')
  }
}
```

### Using Custom Agent with MicdropServer

```typescript
// Create custom agent
const agent = new CustomAgent({
  apiKey: process.env.YOUR_API_KEY || '',
  systemPrompt: 'You are a helpful assistant.',
  model: 'your-model-name',
})

// Add logging
agent.logger = new Logger('CustomAgent')

// Setup event handlers
agent.on('Message', (message) => {
  console.log(`${message.role}: ${message.content}`)
})

// Create server with custom agent
new MicdropServer(socket, {
  agent,
  // ...other options
})
```

### Simple Echo Agent Example

```typescript
import { Agent, AgentOptions } from '@micdrop/server'
import { PassThrough, Readable } from 'stream'

class EchoAgent extends Agent {
  answer(): Readable {
    const stream = new PassThrough()

    // Get the last user message
    const lastUserMessage = this.conversation
      .filter((msg) => msg.role === 'user')
      .pop()

    if (lastUserMessage) {
      const response = `You said: "${lastUserMessage.content}"`

      // Add to conversation
      this.addAssistantMessage(response)

      // Stream the response
      setTimeout(() => {
        stream.write(response)
        stream.end()
      }, 100)
    } else {
      stream.end()
    }

    return stream
  }

  cancel(): void {
    // Nothing to cancel for this simple implementation
  }
}

// Usage
const echoAgent = new EchoAgent({
  systemPrompt: 'You are an echo agent that repeats what users say.',
})

echoAgent.addUserMessage('Hello!')
const response = echoAgent.answer()

response.on('data', (chunk) => {
  console.log('Echo response:', chunk.toString())
})
response.on('end', () => {
  echoAgent.destroy()
})
```
