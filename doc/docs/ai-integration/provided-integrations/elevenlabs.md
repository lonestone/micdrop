# ElevenLabs

ElevenLabs implementation for [@micdrop/server](../../server).

This package provides high-quality real-time text-to-speech implementation using ElevenLabs' streaming API.

## Features

- 🎙️ **ElevenLabs TTS** - High-quality streaming text-to-speech with:
  - Real-time audio streaming via WebSocket
  - Multiple voice models (Multilingual V2, Turbo V2.5, Flash V2.5)
  - Customizable voice settings (stability, similarity, style)
  - Support for 29+ languages
  - Automatic reconnection on connection loss
  - Streaming cancellation support
  - Keep-alive functionality for long sessions

## Installation

```bash
npm install @micdrop/elevenlabs
```

## ElevenLabs TTS (Text-to-Speech)

### Usage

```typescript
import { ElevenLabsTTS } from '@micdrop/elevenlabs'
import { MicdropServer } from '@micdrop/server'

const tts = new ElevenLabsTTS({
  apiKey: process.env.ELEVENLABS_API_KEY || '',
  voiceId: '21m00Tcm4TlvDq8ikWAM', // ElevenLabs voice ID
  modelId: 'eleven_turbo_v2_5', // Optional: model to use
  language: 'en', // Optional: language code
  voiceSettings: {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.5,
  },
})

// Use with MicdropServer
new MicdropServer(socket, {
  tts,
  // ... other options
})
```

### Options

| Option          | Type                                                                     | Default               | Description                       |
| --------------- | ------------------------------------------------------------------------ | --------------------- | --------------------------------- |
| `apiKey`        | `string`                                                                 | Required              | Your ElevenLabs API key           |
| `voiceId`       | `string`                                                                 | Required              | ElevenLabs voice ID               |
| `modelId`       | `'eleven_multilingual_v2' \| 'eleven_turbo_v2_5' \| 'eleven_flash_v2_5'` | `'eleven_turbo_v2_5'` | Model to use for speech synthesis |
| `language`      | `string`                                                                 | Optional              | Language code (e.g., 'en', 'fr')  |
| `outputFormat`  | `TextToSpeechStreamRequestOutputFormat`                                  | `'pcm_16000'`         | Audio output format               |
| `voiceSettings` | `VoiceSettings`                                                          | Optional              | Voice customization settings      |

### Voice Settings

The `voiceSettings` option allows you to customize the voice characteristics:

```typescript
const tts = new ElevenLabsTTS({
  apiKey: 'your-api-key',
  voiceId: 'your-voice-id',
  voiceSettings: {
    stability: 0.5, // 0.0 to 1.0 - Lower = more variable, Higher = more stable
    similarity_boost: 0.75, // 0.0 to 1.0 - How closely to match the original voice
    style: 0.5, // 0.0 to 1.0 - Exaggeration of the style
    use_speaker_boost: true, // Boost the similarity to the speaker
  },
})
```

### Supported Models

| Model                    | Description                                  | Languages     | Speed     |
| ------------------------ | -------------------------------------------- | ------------- | --------- |
| `eleven_multilingual_v2` | High-quality multilingual model              | 29+ languages | Standard  |
| `eleven_turbo_v2_5`      | Fast, high-quality model optimized for speed | English       | Fast      |
| `eleven_flash_v2_5`      | Ultra-fast model for real-time applications  | English       | Very Fast |

### Supported Languages

ElevenLabs supports 29+ languages including:

| Code | Language | Code | Language | Code | Language   |
| ---- | -------- | ---- | -------- | ---- | ---------- |
| `en` | English  | `es` | Spanish  | `fr` | French     |
| `de` | German   | `it` | Italian  | `pt` | Portuguese |
| `pl` | Polish   | `tr` | Turkish  | `ru` | Russian    |
| `nl` | Dutch    | `cs` | Czech    | `ar` | Arabic     |
| `zh` | Chinese  | `ja` | Japanese | `hu` | Hungarian  |
| `ko` | Korean   | `hi` | Hindi    | `fi` | Finnish    |

## ElevenLabsFetchTTS (Non-Streaming)

For simpler use cases where you don't need real-time streaming:

```typescript
import { ElevenLabsFetchTTS } from '@micdrop/elevenlabs'

const tts = new ElevenLabsFetchTTS({
  apiKey: process.env.ELEVENLABS_API_KEY || '',
  voiceId: '21m00Tcm4TlvDq8ikWAM',
  modelId: 'eleven_turbo_v2_5',
})

// This will wait for the complete text before generating audio
new MicdropServer(socket, {
  tts,
  // ... other options
})
```

## Getting Started

1. Sign up for an [ElevenLabs account](https://elevenlabs.io) and get your API key
2. Choose a voice from the ElevenLabs voice library or create a custom voice
3. Install the package and configure with your credentials

```typescript
import { ElevenLabsTTS } from '@micdrop/elevenlabs'

const tts = new ElevenLabsTTS({
  apiKey: 'your-elevenlabs-api-key',
  voiceId: 'your-voice-id', // Get this from ElevenLabs dashboard
  modelId: 'eleven_turbo_v2_5', // Choose based on your needs
  language: 'en',
  voiceSettings: {
    stability: 0.5,
    similarity_boost: 0.75,
  },
})

// Use with MicdropServer
new MicdropServer(socket, {
  tts,
  // ... other options
})
```

### Finding Voice IDs

You can find voice IDs in several ways:

1. **ElevenLabs Dashboard**: Browse voices in your ElevenLabs account
2. **Voice Library**: Use the public voice library API
