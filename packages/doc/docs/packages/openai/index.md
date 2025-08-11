# @micdrop/openai

OpenAI integration for Micdrop providing both LLM agent capabilities and speech-to-text functionality using GPT models and Whisper.

## Features

- 🤖 **OpenaiAgent** - GPT-powered conversational AI with streaming responses
- 🎙️ **OpenaiSTT** - Whisper-based speech-to-text transcription
- ⚡ **Streaming Support** - Real-time response generation
- 🛠️ **Tool Support** - Function calling with OpenAI tools
- 🔧 **Highly Configurable** - Full control over model parameters

## Installation

```bash
npm install @micdrop/openai
# or
yarn add @micdrop/openai
# or
pnpm add @micdrop/openai
```

## OpenaiAgent

### Quick Start

```typescript
import { OpenaiAgent } from '@micdrop/openai'

const agent = new OpenaiAgent({
  apiKey: process.env.OPENAI_API_KEY!,
  systemPrompt: 'You are a helpful voice assistant.',
  model: 'gpt-4o', // Optional: defaults to gpt-4o
})

// Use with MicdropServer
new MicdropServer(socket, {
  agent,
  // ... other options
})
```

### Configuration Options

```typescript
interface OpenaiAgentOptions {
  apiKey: string
  systemPrompt: string
  model?: string // Default: 'gpt-4o'
  maxTokens?: number
  temperature?: number
  tools?: OpenAITool[]
  // ... other OpenAI parameters
}
```

### With Function Tools

```typescript
import { OpenaiAgent } from '@micdrop/openai'

const agent = new OpenaiAgent({
  apiKey: process.env.OPENAI_API_KEY!,
  systemPrompt: 'You are a helpful assistant with access to tools.',
  tools: [
    {
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Get current weather for a location',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'City name'
            }
          },
          required: ['location']
        }
      }
    }
  ],
  toolHandler: async (toolCall) => {
    if (toolCall.function.name === 'get_weather') {
      const { location } = JSON.parse(toolCall.function.arguments)
      // Call weather API
      return `The weather in ${location} is sunny, 75°F`
    }
  }
})
```

## OpenaiSTT

### Quick Start

```typescript
import { OpenaiSTT } from '@micdrop/openai'

const stt = new OpenaiSTT({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'whisper-1',
  language: 'en', // Optional: auto-detect if not specified
})

// Use with MicdropServer
new MicdropServer(socket, {
  stt,
  // ... other options
})
```

### Configuration Options

```typescript
interface OpenaiSTTOptions {
  apiKey: string
  model?: string // Default: 'whisper-1'
  language?: string // ISO language code
  prompt?: string // Context for better accuracy
  temperature?: number
  responseFormat?: 'json' | 'text' | 'srt' | 'vtt'
}
```

### Advanced Usage

```typescript
const stt = new OpenaiSTT({
  apiKey: process.env.OPENAI_API_KEY!,
  language: 'en',
  prompt: 'This is a conversation about technology and AI.', // Helps with accuracy
  temperature: 0, // More deterministic
})
```

## Complete Example

```typescript
import { MicdropServer } from '@micdrop/server'
import { OpenaiAgent, OpenaiSTT } from '@micdrop/openai'
import { ElevenLabsTTS } from '@micdrop/elevenlabs'
import { WebSocketServer } from 'ws'

const wss = new WebSocketServer({ port: 8080 })

wss.on('connection', (socket) => {
  const agent = new OpenaiAgent({
    apiKey: process.env.OPENAI_API_KEY!,
    systemPrompt: `You are a helpful voice assistant. 
    Keep responses concise and conversational since this is a voice interface.`,
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 150,
  })

  const stt = new OpenaiSTT({
    apiKey: process.env.OPENAI_API_KEY!,
    language: 'en',
  })

  const tts = new ElevenLabsTTS({
    apiKey: process.env.ELEVENLABS_API_KEY!,
    voiceId: process.env.ELEVENLABS_VOICE_ID!,
  })

  new MicdropServer(socket, {
    firstMessage: 'Hello! I'm your AI assistant. How can I help you today?',
    agent,
    stt,
    tts,
  })
})
```

## API Reference

- **[OpenaiAgent](../../api/openai/OpenaiAgent.md)** - GPT-powered conversational agent
- **[OpenaiSTT](../../api/openai/OpenaiSTT.md)** - Whisper-based speech-to-text

## Environment Variables

```bash title=".env"
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Override default models
OPENAI_MODEL=gpt-4o
OPENAI_STT_MODEL=whisper-1
```

## Supported Models

### Chat Models (Agent)
- `gpt-4o` (recommended for voice applications)
- `gpt-4o-mini` (cost-effective option)
- `gpt-4-turbo`
- `gpt-3.5-turbo`

### Speech-to-Text Models
- `whisper-1` (currently the only Whisper model available)

## Best Practices

### For Voice Applications

```typescript
const agent = new OpenaiAgent({
  apiKey: process.env.OPENAI_API_KEY!,
  systemPrompt: `You are a voice assistant. Follow these guidelines:
    - Keep responses under 50 words when possible
    - Use natural, conversational language
    - Avoid complex formatting or lists
    - Ask follow-up questions to keep conversation flowing`,
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 100, // Limit response length
})
```

### Error Handling

```typescript
agent.on('error', (error) => {
  console.error('OpenAI Agent error:', error)
  // Handle rate limits, API errors, etc.
})

stt.on('error', (error) => {
  console.error('OpenAI STT error:', error)
})
```

## Pricing Considerations

- **GPT-4o**: Higher quality, more expensive
- **GPT-4o-mini**: Good balance of quality and cost
- **Whisper**: Very cost-effective for STT
- Use `maxTokens` to control costs
- Consider caching frequently asked questions

## Next Steps

- Learn about [Function Tools](./tools.md)
- Explore [Other AI Providers](../elevenlabs/)
- Check out [Custom Agents](../../guides/custom-agents.md)
- View [Complete Examples](../../examples/)