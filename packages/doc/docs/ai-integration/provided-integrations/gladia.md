# Gladia

Fast, multilingual speech-to-text with high accuracy and real-time processing.

## Installation

```bash
npm install @micdrop/gladia
```

## Basic Usage

```typescript
import { GladiaSTT } from '@micdrop/gladia'

const stt = new GladiaSTT({
  apiKey: process.env.GLADIA_API_KEY,
  language: 'en'
})
```

## Key Features

- **Fast transcription** - ~200ms processing time
- **99+ languages** - Extensive multilingual support
- **Real-time processing** - Optimized for streaming audio
- **High accuracy** - Advanced speech recognition models

## Configuration

```typescript
const stt = new GladiaSTT({
  apiKey: process.env.GLADIA_API_KEY,
  language: 'en',
  enableDiarization: false,
  enablePunctuation: true,
  model: 'fast'
})
```

## Complete Example

```typescript
import { MicdropServer } from '@micdrop/server'
import { OpenaiAgent } from '@micdrop/openai'
import { GladiaSTT } from '@micdrop/gladia'
import { ElevenLabsTTS } from '@micdrop/elevenlabs'

wss.on('connection', (socket) => {
  const stt = new GladiaSTT({
    apiKey: process.env.GLADIA_API_KEY,
    language: 'en'
  })

  const agent = new OpenaiAgent({
    apiKey: process.env.OPENAI_API_KEY
  })

  const tts = new ElevenLabsTTS({
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: process.env.ELEVENLABS_VOICE_ID
  })

  new MicdropServer(socket, { agent, stt, tts })
})
```

For detailed language support and configuration options, see the [Gladia package README](../../../packages/gladia/README.md).