# AI Integration

Integrate speech-to-text, text-to-speech, and AI agents from multiple providers or build custom implementations.

## Overview

Micdrop provides a modular AI architecture allowing you to:

- **Mix and match** providers for optimal cost and quality
- **Switch providers** without changing your application code  
- **Build custom integrations** using abstract base classes
- **Scale cost-effectively** by choosing the right provider for each use case

## Provider Categories

### Provided Integrations

Ready-to-use implementations for popular AI services:

**Speech-to-Text (STT):**
- **[Gladia](./provided-integrations/gladia)** - Fast, accurate multilingual transcription
- **[OpenAI Whisper](./provided-integrations/openai)** - High-quality speech recognition

**Text-to-Speech (TTS):**  
- **[ElevenLabs](./provided-integrations/elevenlabs)** - High-quality voice synthesis
- **[Cartesia](./provided-integrations/cartesia)** - Low-latency streaming TTS

**AI Agents (LLM):**
- **[OpenAI](./provided-integrations/openai)** - GPT models for conversation
- **[Mistral](./provided-integrations/mistral)** - Open-source and commercial LLMs

### Custom Integrations

Build your own integrations using abstract base classes:

- **[Custom Agent](./custom-integrations/custom-agent)** - Create custom AI agents
- **[Custom STT](./custom-integrations/custom-stt)** - Implement speech-to-text services
- **[Custom TTS](./custom-integrations/custom-tts)** - Build text-to-speech providers

## Quick Start

### Basic Setup

```typescript
import { MicdropServer } from '@micdrop/server'
import { OpenaiAgent } from '@micdrop/openai'
import { ElevenLabsTTS } from '@micdrop/elevenlabs'
import { GladiaSTT } from '@micdrop/gladia'

new MicdropServer(socket, {
  // AI Agent for conversation
  agent: new OpenaiAgent({
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4-turbo-preview'
  }),
  
  // Speech-to-Text
  stt: new GladiaSTT({
    apiKey: process.env.GLADIA_API_KEY,
    language: 'en'
  }),
  
  // Text-to-Speech
  tts: new ElevenLabsTTS({
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: 'voice-id-here'
  })
})
```

### Cost-Optimized Setup

```typescript
// Use different providers for optimal cost/quality balance
new MicdropServer(socket, {
  agent: new MistralAgent({        // Cost-effective LLM
    apiKey: process.env.MISTRAL_API_KEY,
    model: 'mistral-large-latest'
  }),
  
  stt: new GladiaSTT({            // Fast, affordable STT
    apiKey: process.env.GLADIA_API_KEY
  }),
  
  tts: new CartesiaTTS({          // Low-latency TTS
    apiKey: process.env.CARTESIA_API_KEY,
    voiceId: 'cartesia-voice-id'
  })
})
```

## Provider Comparison

### Speech-to-Text Comparison

| Provider | Latency | Languages | Cost | Best For |
|----------|---------|-----------|------|----------|
| **Gladia** | ~200ms | 99+ | $ | General use, multilingual |
| **OpenAI Whisper** | ~300ms | 57 | $$ | High accuracy, English |

### Text-to-Speech Comparison

| Provider | Latency | Quality | Voices | Best For |
|----------|---------|---------|---------|----------|
| **ElevenLabs** | ~400ms | Excellent | 1000+ | High-quality voices |
| **Cartesia** | ~150ms | Good | 50+ | Low-latency streaming |

### AI Agent Comparison

| Provider | Speed | Quality | Cost | Best For |
|----------|-------|---------|------|----------|
| **OpenAI GPT-4** | Medium | Excellent | $$$ | Complex reasoning |
| **OpenAI GPT-3.5** | Fast | Good | $ | Simple conversations |
| **Mistral Large** | Fast | Excellent | $$ | Cost-effective quality |

## Configuration Patterns

### Environment-Based Selection

```typescript
function createAIComponents() {
  const env = process.env.NODE_ENV
  
  if (env === 'development') {
    return {
      agent: new OpenaiAgent({ 
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-3.5-turbo' // Faster for dev
      }),
      stt: new GladiaSTT({ apiKey: process.env.GLADIA_API_KEY }),
      tts: new CartesiaTTS({ apiKey: process.env.CARTESIA_API_KEY })
    }
  }
  
  return {
    agent: new OpenaiAgent({ 
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4-turbo-preview' // Better quality for prod
    }),
    stt: new GladiaSTT({ apiKey: process.env.GLADIA_API_KEY }),
    tts: new ElevenLabsTTS({ 
      apiKey: process.env.ELEVENLABS_API_KEY,
      voiceId: process.env.ELEVENLABS_VOICE_ID
    })
  }
}
```

### User-Based Selection

```typescript
function createUserAIComponents(userPreferences) {
  const components = {}
  
  // Select TTS based on user preference
  if (userPreferences.voiceQuality === 'high') {
    components.tts = new ElevenLabsTTS({
      apiKey: process.env.ELEVENLABS_API_KEY,
      voiceId: userPreferences.voiceId
    })
  } else {
    components.tts = new CartesiaTTS({
      apiKey: process.env.CARTESIA_API_KEY,
      voiceId: userPreferences.voiceId
    })
  }
  
  // Select model based on subscription
  const model = userPreferences.isPremium ? 'gpt-4-turbo-preview' : 'gpt-3.5-turbo'
  components.agent = new OpenaiAgent({
    apiKey: process.env.OPENAI_API_KEY,
    model
  })
  
  return components
}
```

## Error Handling

Handle provider failures gracefully:

```typescript
async function createRobustAIComponents() {
  const components = {}
  
  // Try primary TTS, fallback to secondary
  try {
    components.tts = new ElevenLabsTTS({
      apiKey: process.env.ELEVENLABS_API_KEY,
      voiceId: process.env.ELEVENLABS_VOICE_ID
    })
  } catch (error) {
    console.warn('ElevenLabs failed, using Cartesia fallback')
    components.tts = new CartesiaTTS({
      apiKey: process.env.CARTESIA_API_KEY,
      voiceId: 'fallback-voice'
    })
  }
  
  // Always have an agent
  components.agent = new OpenaiAgent({
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-3.5-turbo'
  })
  
  return components
}
```

## Provider Switching

Switch providers dynamically:

```typescript
class DynamicMicdropServer {
  private currentComponents: any
  
  constructor(private socket: WebSocket) {}
  
  async switchTTS(provider: 'elevenlabs' | 'cartesia') {
    const newTTS = provider === 'elevenlabs' 
      ? new ElevenLabsTTS({ apiKey: process.env.ELEVENLABS_API_KEY })
      : new CartesiaTTS({ apiKey: process.env.CARTESIA_API_KEY })
    
    // Update the TTS component
    this.currentComponents.tts = newTTS
    
    // Restart with new components
    await this.restart()
  }
  
  private async restart() {
    // Recreate MicdropServer with updated components
    new MicdropServer(this.socket, this.currentComponents)
  }
}
```

## Next Steps

### Getting Started
- **[OpenAI](./provided-integrations/openai)** - Most popular LLM and STT provider
- **[ElevenLabs](./provided-integrations/elevenlabs)** - High-quality voice synthesis

### Advanced Usage  
- **[Custom Agent](./custom-integrations/custom-agent)** - Build your own AI agent
- **[Provider Optimization](./optimization)** - Performance and cost optimization tips