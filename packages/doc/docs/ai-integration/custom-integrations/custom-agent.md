# Custom Agent

Build your own AI agent implementation by extending the abstract Agent base class.

## Overview

The Agent class provides the foundation for creating custom AI agents that can handle conversation generation and management in Micdrop voice applications.

## Basic Implementation

```typescript
import { Agent } from '@micdrop/server'

class MyCustomAgent extends Agent {
  private apiKey: string
  private model: string
  
  constructor(options: { apiKey: string; model?: string }) {
    super()
    this.apiKey = options.apiKey
    this.model = options.model || 'default-model'
  }

  async answer(messages: Array<{ role: string; content: string }>): Promise<AsyncGenerator<string>> {
    // Implement your AI service call here
    const response = await this.callYourAIService(messages)
    
    // Return an async generator that yields text chunks
    return this.createTextGenerator(response)
  }

  async cancel(): Promise<void> {
    // Implement cancellation logic
    console.log('Cancelling current request...')
  }

  private async *createTextGenerator(text: string): AsyncGenerator<string> {
    // Stream the response in chunks
    const words = text.split(' ')
    for (const word of words) {
      yield word + ' '
      await new Promise(resolve => setTimeout(resolve, 50)) // Simulate streaming
    }
  }

  private async callYourAIService(messages: any[]): Promise<string> {
    // Implement your AI service integration
    // This could be OpenAI, Anthropic, local LLM, etc.
    return 'This is a response from my custom AI service'
  }
}
```

## Agent Events

Your custom agent should emit events for conversation management:

```typescript
class EventEmittingAgent extends Agent {
  async answer(messages: Array<{ role: string; content: string }>): Promise<AsyncGenerator<string>> {
    // Get the latest user message
    const userMessage = messages[messages.length - 1]
    
    // Emit the user message
    this.emit('Message', {
      role: 'user',
      content: userMessage.content
    })

    // Generate AI response
    const response = await this.generateResponse(messages)
    
    // Emit the assistant message
    this.emit('Message', {
      role: 'assistant', 
      content: response
    })

    // Return streaming generator
    return this.streamResponse(response)
  }

  private async *streamResponse(text: string): AsyncGenerator<string> {
    const chunks = text.split(' ')
    for (const chunk of chunks) {
      yield chunk + ' '
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
}
```

## Advanced Features

### Conversation Context Management

```typescript
class ContextAwareAgent extends Agent {
  private conversationHistory: Array<{ role: string; content: string }> = []
  private maxHistoryLength = 10

  async answer(messages: Array<{ role: string; content: string }>): Promise<AsyncGenerator<string>> {
    // Update conversation history
    this.updateConversationHistory(messages)
    
    // Use full context for better responses
    const contextualMessages = this.getContextualMessages()
    const response = await this.generateWithContext(contextualMessages)
    
    return this.streamResponse(response)
  }

  private updateConversationHistory(messages: any[]) {
    this.conversationHistory = [...messages]
    
    // Keep only recent messages to manage context length
    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength)
    }
  }

  private getContextualMessages() {
    return this.conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
  }
}
```

### Tool Integration

```typescript
interface Tool {
  name: string
  description: string
  execute(params: any): Promise<string>
}

class ToolEnabledAgent extends Agent {
  private tools: Map<string, Tool> = new Map()

  constructor(options: any) {
    super()
    this.setupTools()
  }

  addTool(tool: Tool) {
    this.tools.set(tool.name, tool)
  }

  async answer(messages: Array<{ role: string; content: string }>): Promise<AsyncGenerator<string>> {
    const lastMessage = messages[messages.length - 1].content
    
    // Check if user is requesting to use a tool
    const toolRequest = this.parseToolRequest(lastMessage)
    
    if (toolRequest) {
      const result = await this.executeTool(toolRequest.name, toolRequest.params)
      return this.streamResponse(result)
    }
    
    // Regular AI response
    return this.generateRegularResponse(messages)
  }

  private async executeTool(toolName: string, params: any): Promise<string> {
    const tool = this.tools.get(toolName)
    if (!tool) {
      return `Tool '${toolName}' not found`
    }
    
    try {
      return await tool.execute(params)
    } catch (error) {
      return `Error executing tool: ${error.message}`
    }
  }
}
```

## Real-World Example

Here's a complete example integrating with a custom AI service:

```typescript
import { Agent } from '@micdrop/server'
import axios from 'axios'

class CustomLLMAgent extends Agent {
  private baseURL: string
  private apiKey: string
  private model: string
  private systemPrompt: string

  constructor(options: {
    baseURL: string
    apiKey: string
    model: string
    systemPrompt: string
  }) {
    super()
    this.baseURL = options.baseURL
    this.apiKey = options.apiKey
    this.model = options.model
    this.systemPrompt = options.systemPrompt
  }

  async answer(messages: Array<{ role: string; content: string }>): Promise<AsyncGenerator<string>> {
    try {
      // Prepare messages with system prompt
      const formattedMessages = [
        { role: 'system', content: this.systemPrompt },
        ...messages
      ]

      // Call custom AI service
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: this.model,
        messages: formattedMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 150
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        responseType: 'stream'
      })

      // Emit user message
      const userMessage = messages[messages.length - 1]
      this.emit('Message', {
        role: 'user',
        content: userMessage.content
      })

      // Process streaming response
      return this.processStreamingResponse(response.data)

    } catch (error) {
      console.error('Custom LLM Agent error:', error)
      throw error
    }
  }

  private async *processStreamingResponse(stream: any): AsyncGenerator<string> {
    let fullResponse = ''

    for await (const chunk of stream) {
      const lines = chunk.toString().split('\n')
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          
          if (data === '[DONE]') {
            // Emit complete assistant message
            this.emit('Message', {
              role: 'assistant',
              content: fullResponse.trim()
            })
            return
          }

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices[0]?.delta?.content
            
            if (content) {
              fullResponse += content
              yield content
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  async cancel(): Promise<void> {
    // Implement request cancellation
    console.log('Cancelling custom LLM request')
  }
}

// Usage
const customAgent = new CustomLLMAgent({
  baseURL: 'https://your-ai-service.com/v1',
  apiKey: process.env.CUSTOM_AI_API_KEY,
  model: 'your-custom-model',
  systemPrompt: 'You are a helpful AI assistant'
})
```

## Testing Your Agent

```typescript
// Test your custom agent
async function testAgent() {
  const agent = new MyCustomAgent({
    apiKey: 'test-key'
  })

  const messages = [
    { role: 'user', content: 'Hello, how are you?' }
  ]

  const responseGenerator = await agent.answer(messages)
  
  for await (const chunk of responseGenerator) {
    process.stdout.write(chunk)
  }
}
```

For more details on the Agent interface and available methods, see the [Agent documentation](../../../packages/server/docs/Agent.md).