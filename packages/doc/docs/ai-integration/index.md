# AI Integration

Integrate speech-to-text, text-to-speech, and AI agents from multiple providers or build custom implementations.

## Overview

Micdrop provides a modular AI architecture allowing you to:

- **Mix and match** providers for optimal cost and quality
- **Build custom integrations** using abstract base classes

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
    model: 'gpt-4-turbo-preview',
  }),

  // Speech-to-Text
  stt: new GladiaSTT({
    apiKey: process.env.GLADIA_API_KEY,
    language: 'en',
  }),

  // Text-to-Speech
  tts: new ElevenLabsTTS({
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: 'voice-id-here',
  }),
})
```

### Cost-Optimized Setup

```typescript
// Use different providers for optimal cost/quality balance
new MicdropServer(socket, {
  agent: new MistralAgent({
    // Cost-effective LLM
    apiKey: process.env.MISTRAL_API_KEY,
    model: 'mistral-large-latest',
  }),

  stt: new GladiaSTT({
    // Fast, affordable STT
    apiKey: process.env.GLADIA_API_KEY,
  }),

  tts: new CartesiaTTS({
    // Low-latency TTS
    apiKey: process.env.CARTESIA_API_KEY,
    voiceId: 'cartesia-voice-id',
  }),
})
```

## Models Comparison

### Speech-to-Text Comparison

| Provider           | Latency | Languages | Cost | Best For                    |
| ------------------ | ------- | --------- | ---- | --------------------------- |
| **Gladia 🇫🇷**      | ~200ms  | 99+       | $    | General use, multilingual   |
| **OpenAI Whisper** | ~300ms  | 57        | $$   | High accuracy, multilingual |

### Text-to-Speech Comparison

| Provider       | Latency | Quality   | Voices | Best For              |
| -------------- | ------- | --------- | ------ | --------------------- |
| **ElevenLabs** | ~400ms  | Excellent | 1000+  | High-quality voices   |
| **Cartesia**   | ~150ms  | Good      | 50+    | Low-latency streaming |

### AI Agent Comparison

| Provider             | Speed  | Quality   | Cost | Best For               |
| -------------------- | ------ | --------- | ---- | ---------------------- |
| **OpenAI GPT-4**     | Medium | Excellent | $$$  | Complex reasoning      |
| **OpenAI GPT-3.5**   | Fast   | Good      | $    | Simple conversations   |
| **Mistral Large 🇫🇷** | Fast   | Excellent | $$   | Cost-effective quality |
