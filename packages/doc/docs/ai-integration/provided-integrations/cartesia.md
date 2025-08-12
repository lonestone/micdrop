# Cartesia

Low-latency streaming text-to-speech for real-time voice applications.

## Installation

```bash
npm install @micdrop/cartesia
```

## Basic Usage

```typescript
import { CartesiaTTS } from '@micdrop/cartesia'

const tts = new CartesiaTTS({
  apiKey: process.env.CARTESIA_API_KEY,
  voiceId: 'your-cartesia-voice-id'
})
```

## Key Features

- **Ultra-low latency** - ~150ms response time
- **Streaming synthesis** - Audio generation as text is processed  
- **Real-time optimization** - Designed for conversational AI
- **Multiple languages** - Support for 50+ languages

## Configuration

```typescript
const tts = new CartesiaTTS({
  apiKey: process.env.CARTESIA_API_KEY,
  voiceId: process.env.CARTESIA_VOICE_ID,
  model: 'sonic-english',
  language: 'en',
  encoding: 'pcm_s16le',
  sampleRate: 22050
})
```

For detailed configuration and streaming features, see the [Cartesia package README](../../../packages/cartesia/README.md).