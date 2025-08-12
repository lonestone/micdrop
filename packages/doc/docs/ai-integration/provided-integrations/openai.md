# OpenAI

Integrate OpenAI's GPT models for AI agents and Whisper for speech-to-text in your voice conversations.

## Installation

```bash
npm install @micdrop/openai
```

## OpenAI Agent (GPT Models)

Use GPT models for intelligent conversation:

```typescript
import { OpenaiAgent } from '@micdrop/openai'

const agent = new OpenaiAgent({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4-turbo-preview',
  systemPrompt: 'You are a helpful voice assistant'
})
```

### Configuration Options

```typescript
const agent = new OpenaiAgent({
  // Required
  apiKey: 'your-openai-api-key',
  
  // Optional
  model: 'gpt-4-turbo-preview',        // Default: gpt-3.5-turbo
  systemPrompt: 'Custom instructions',  // Default: generic assistant prompt
  temperature: 0.7,                     // Default: 0.7
  maxTokens: 150,                       // Default: 150
  
  // Advanced options
  baseURL: 'https://api.openai.com/v1', // Custom API endpoint
  timeout: 30000,                       // Request timeout in ms
})
```

### Model Options

| Model | Speed | Quality | Cost | Use Case |
|-------|-------|---------|------|----------|
| `gpt-3.5-turbo` | Fast | Good | $ | Quick responses, simple tasks |
| `gpt-4-turbo-preview` | Medium | Excellent | $$$ | Complex reasoning, detailed responses |
| `gpt-4` | Slow | Excellent | $$$$ | Highest quality, complex tasks |

## OpenAI STT (Whisper)

Use Whisper for speech-to-text conversion:

```typescript
import { OpenaiSTT } from '@micdrop/openai'

const stt = new OpenaiSTT({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'whisper-1',
  language: 'en'
})
```

### STT Configuration

```typescript
const stt = new OpenaiSTT({
  // Required
  apiKey: 'your-openai-api-key',
  
  // Optional
  model: 'whisper-1',          // Default: whisper-1
  language: 'en',              // Auto-detect if not specified
  temperature: 0,              // Default: 0 (deterministic)
  
  // Advanced options
  prompt: 'Custom transcription prompt',
  baseURL: 'https://api.openai.com/v1'
})
```

## Complete Example

```typescript
import { MicdropServer } from '@micdrop/server'
import { OpenaiAgent, OpenaiSTT } from '@micdrop/openai'
import { ElevenLabsTTS } from '@micdrop/elevenlabs'

wss.on('connection', (socket) => {
  const agent = new OpenaiAgent({
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4-turbo-preview',
    systemPrompt: 'You are a helpful voice assistant. Keep responses concise.',
    temperature: 0.7
  })

  const stt = new OpenaiSTT({
    apiKey: process.env.OPENAI_API_KEY,
    language: 'en'
  })

  const tts = new ElevenLabsTTS({
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: process.env.ELEVENLABS_VOICE_ID
  })

  new MicdropServer(socket, {
    firstMessage: 'Hello! I\'m powered by OpenAI GPT-4. How can I help?',
    agent,
    stt,
    tts
  })
})
```

For detailed configuration options and examples, see the [OpenAI package README](../../../packages/openai/README.md).