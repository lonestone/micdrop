# ElevenLabs

High-quality text-to-speech with natural-sounding voices and emotional expression.

## Installation

```bash
npm install @micdrop/elevenlabs
```

## Basic Usage

```typescript
import { ElevenLabsTTS } from '@micdrop/elevenlabs'

const tts = new ElevenLabsTTS({
  apiKey: process.env.ELEVENLABS_API_KEY,
  voiceId: process.env.ELEVENLABS_VOICE_ID
})
```

## Configuration Options

```typescript
const tts = new ElevenLabsTTS({
  // Required
  apiKey: 'your-elevenlabs-api-key',
  voiceId: 'voice-id-from-elevenlabs',
  
  // Optional
  model: 'eleven_turbo_v2',         // Default: eleven_turbo_v2
  stability: 0.5,                   // Voice stability (0-1)
  similarityBoost: 0.75,           // Voice similarity (0-1)
  style: 0.0,                      // Voice style (0-1)
  useSpeakerBoost: true,           // Enhance speaker clarity
  
  // Advanced options
  baseURL: 'https://api.elevenlabs.io/v1',
  timeout: 30000
})
```

### Available Models

| Model | Speed | Quality | Use Case |
|-------|-------|---------|----------|
| `eleven_turbo_v2` | Fast | High | Real-time conversations |
| `eleven_multilingual_v2` | Medium | High | Multiple languages |
| `eleven_monolingual_v1` | Slow | Highest | English only, best quality |

### Voice Settings

- **Stability (0-1)**: Higher = more consistent, lower = more expressive
- **Similarity Boost (0-1)**: How closely to match the original voice
- **Style (0-1)**: Amount of stylistic expression (if supported)
- **Speaker Boost**: Enhances clarity and reduces artifacts

## Voice Selection

Find voice IDs in your ElevenLabs dashboard:

```typescript
// Popular pre-made voices (check ElevenLabs for current IDs)
const voices = {
  rachel: '21m00Tcm4TlvDq8ikWAM',    // Calm, young female
  drew: '29vD33N1CtxCmqQRPOHJ',      // Well-rounded male  
  clyde: '2EiwWnXFnvU5JabPnv8n',     // Middle-aged male
  bella: 'EXAVITQu4vr4xnSDxMaL'      // Expressive female
}

const tts = new ElevenLabsTTS({
  apiKey: process.env.ELEVENLABS_API_KEY,
  voiceId: voices.rachel
})
```

## Complete Example

```typescript
import { MicdropServer } from '@micdrop/server'
import { OpenaiAgent } from '@micdrop/openai'
import { ElevenLabsTTS } from '@micdrop/elevenlabs'

wss.on('connection', (socket) => {
  const agent = new OpenaiAgent({
    apiKey: process.env.OPENAI_API_KEY,
    systemPrompt: 'You are a friendly, expressive voice assistant.'
  })

  const tts = new ElevenLabsTTS({
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: process.env.ELEVENLABS_VOICE_ID,
    model: 'eleven_turbo_v2',
    stability: 0.6,
    similarityBoost: 0.8,
    useSpeakerBoost: true
  })

  new MicdropServer(socket, {
    firstMessage: 'Hi there! I speak with a natural ElevenLabs voice.',
    agent,
    tts
  })
})
```

For detailed configuration and voice cloning features, see the [ElevenLabs package README](../../../packages/elevenlabs/README.md).