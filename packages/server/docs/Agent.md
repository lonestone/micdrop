# Agent

The `Agent` class is the core abstraction for AI conversation handling in Micdrop. It provides a standardized interface for integrating various AI providers into real-time voice conversations.

## Available Implementations

- [OpenaiAgent](../../openai/src/OpenaiAgent.ts) from [@micdrop/openai](../../openai/README.md)
- [MistralAgent](../../mistral/src/MistralAgent.ts) from [@micdrop/mistral](../../mistral/README.md)
- [MockAgent](../src/agent/MockAgent.ts) for testing

## Overview

The `Agent` class is an abstract base class that extends `EventEmitter` (from `eventemitter3`) and manages:

- Conversation history with role-based messages (system, user, assistant)
- Streaming response generation with both stream and promise interfaces
- Event emission for conversation state changes
- Cancellation and cleanup mechanisms
- Integration with logging systems

```typescript
export abstract class Agent<Options extends AgentOptions = AgentOptions> extends EventEmitter {
  public logger?: Logger
  public conversation: MicdropConversation

  constructor(protected options: Options)

  // Generate a streaming response with both stream and promise interfaces
  abstract answer(): AgentAnswerReturn

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

export interface AgentAnswerReturn {
  text: Promise<string>
  stream: Readable
}

export interface TextPromise {
  promise: Promise<string>
  resolve: (value: string) => void
  reject: (reason?: any) => void
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

### `answer(): AgentAnswerReturn`

Generates a streaming response based on the current conversation history. Must return an `AgentAnswerReturn` object containing both a stream and a promise.

**Return Value:**

- `stream`: A `Readable` stream that emits text chunks in real-time
- `text`: A `Promise<string>` that resolves with the complete response text

**Implementation Requirements:**

- Return an `AgentAnswerReturn` object with both stream and promise
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

Adds a user message to the conversation history and emits a `Message` event.

```typescript
agent.addUserMessage('Hello, how are you?')
```

### `addAssistantMessage(text: string)`

Adds an assistant message to the conversation history and emits a `Message` event.

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

## Protected Methods

### `addMessage(role: 'user' | 'assistant' | 'system', text: string)`

Internal method to add any type of message to the conversation and emit the `Message` event.

### `endCall()`

Emits the `EndCall` event to signal that the conversation should end.

### `cancelLastUserMessage()`

Removes the last user message from the conversation history (if it exists) and emits the `CancelLastUserMessage` event.

### `cancelLastAssistantMessage()`

Removes the last assistant message from the conversation history (if it exists) and emits the `CancelLastAssistantMessage` event.

### `skipAnswer()`

Emits the `SkipAnswer` event to indicate the agent is skipping the current response.

### `createTextPromise(): TextPromise`

Utility method to create a promise with external resolve/reject functions, useful for streaming implementations.

### `log(...message: any[])`

Logs messages using the attached logger if available.

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
import {
  Agent,
  AgentOptions,
  AgentAnswerReturn,
  TextPromise,
} from '@micdrop/server'
import { PassThrough, Writable } from 'stream'

interface CustomAgentOptions extends AgentOptions {
  apiKey: string
  model?: string
  settings?: any // Provider-specific settings
}

const DEFAULT_MODEL = 'gpt-4'

class CustomAgent extends Agent<CustomAgentOptions> {
  private cancelled: boolean = false
  private running: boolean = false

  constructor(options: CustomAgentOptions) {
    super(options)
  }

  answer(): AgentAnswerReturn {
    this.log('Start answering')
    this.cancelled = false
    const stream = new PassThrough()
    const textPromise = this.createTextPromise()
    this.generateAnswer(stream, textPromise)
    return { text: textPromise.promise, stream }
  }

  private async generateAnswer(stream: Writable, textPromise: TextPromise) {
    this.running = true
    this.cancelled = false

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
          model: this.options.model || DEFAULT_MODEL,
          stream: true,
          ...this.options.settings,
        }),
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      let fullResponse = ''

      while (reader) {
        if (this.cancelled) return

        const { done, value } = await reader.read()
        if (done) break

        // Parse streaming response (format depends on your provider)
        const chunk = new TextDecoder().decode(value)
        const text = this.parseChunk(chunk)

        if (text) {
          this.log(`Answer chunk: "${text}"`)
          stream.write(text)
          fullResponse += text
        }
      }

      // Add complete response to conversation
      this.addAssistantMessage(fullResponse)
      textPromise.resolve(fullResponse)
    } catch (error: any) {
      console.error('[CustomAgent] Error:', error)
      textPromise.reject(error)
      stream.emit('error', error)
    } finally {
      if (stream.writable) {
        stream.end()
      }
      this.running = false
    }
  }

  private parseChunk(chunk: string): string {
    // Implement your provider's specific chunk parsing logic here
    // This is a placeholder - adapt to your provider's format
    try {
      const lines = chunk.split('\n').filter((line) => line.trim())
      let text = ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') break

          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content
          if (typeof content === 'string') {
            text += content
          }
        }
      }

      return text
    } catch (error) {
      this.log('Error parsing chunk:', error)
      return ''
    }
  }

  cancel(): void {
    if (!this.running) return
    this.log('Cancel')
    this.cancelled = true
    this.running = false
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
import { Agent, AgentOptions, AgentAnswerReturn } from '@micdrop/server'
import { PassThrough, Readable } from 'stream'

class EchoAgent extends Agent {
  answer(): AgentAnswerReturn {
    const stream = new PassThrough()
    const textPromise = this.createTextPromise()

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
        textPromise.resolve(response)
      }, 100)
    } else {
      stream.end()
      textPromise.resolve('Hello, how are you?')
    }

    return {
      stream,
      text: textPromise.promise,
    }
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
const { stream, text } = echoAgent.answer()

stream.on('data', (chunk) => {
  console.log('Chunk:', chunk.toString())
})

stream.on('end', async () => {
  console.log('Stream ended')
})

text.then((text) => {
  console.log('Text:', text)
  setTimeout(() => {
    echoAgent.destroy()
  }, 100)
})
```
