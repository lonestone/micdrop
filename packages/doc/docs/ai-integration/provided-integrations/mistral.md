# Mistral

Cost-effective AI agents using Mistral's open-source and commercial language models.

## Installation

```bash
npm install @micdrop/mistral
```

## Basic Usage

```typescript
import { MistralAgent } from '@micdrop/mistral'

const agent = new MistralAgent({
  apiKey: process.env.MISTRAL_API_KEY,
  model: 'mistral-large-latest'
})
```

## Key Features

- **Cost-effective** - Competitive pricing for high-quality models
- **Fast inference** - Optimized for real-time conversations  
- **Multiple models** - From lightweight to advanced reasoning
- **Multilingual** - Strong performance across languages

## Available Models

| Model | Speed | Quality | Cost | Use Case |
|-------|-------|---------|------|----------|
| `mistral-small-latest` | Fast | Good | $ | Simple conversations |
| `mistral-medium-latest` | Medium | Better | $$ | Balanced performance |
| `mistral-large-latest` | Medium | Excellent | $$$ | Advanced reasoning |

## Configuration

```typescript
const agent = new MistralAgent({
  apiKey: process.env.MISTRAL_API_KEY,
  model: 'mistral-large-latest',
  systemPrompt: 'You are a helpful assistant',
  temperature: 0.7,
  maxTokens: 150
})
```

## Complete Example

```typescript
import { MicdropServer } from '@micdrop/server'
import { MistralAgent } from '@micdrop/mistral'
import { ElevenLabsTTS } from '@micdrop/elevenlabs'

wss.on('connection', (socket) => {
  const agent = new MistralAgent({
    apiKey: process.env.MISTRAL_API_KEY,
    model: 'mistral-large-latest',
    systemPrompt: 'You are a knowledgeable assistant powered by Mistral AI'
  })

  const tts = new ElevenLabsTTS({
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: process.env.ELEVENLABS_VOICE_ID
  })

  new MicdropServer(socket, {
    firstMessage: 'Hello! I\'m powered by Mistral AI. How can I assist you?',
    agent,
    tts
  })
})
```

For detailed model capabilities and configuration, see the [Mistral package README](../../../packages/mistral/README.md).