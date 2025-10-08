# Cartesia

Cartesia implementation for [@micdrop/server](../../server).

This package provides high-quality real-time text-to-speech implementation using Cartesia's streaming API.

## Installation

```bash
npm install @micdrop/cartesia
```

## Cartesia TTS (Text-to-Speech)

### Usage

```typescript
import { CartesiaTTS } from '@micdrop/cartesia'
import { MicdropServer } from '@micdrop/server'

const tts = new CartesiaTTS({
  apiKey: process.env.CARTESIA_API_KEY || '',
  modelId: 'sonic-english', // Cartesia model ID
  voiceId: 'a0e99841-438c-4a64-b679-ae501e7d6091', // Voice ID
  language: 'en', // Optional: specify language
  speed: 'normal', // Optional: speech speed
})

// Use with MicdropServer
new MicdropServer(socket, {
  tts,
  // ... other options
})
```

### Options

| Option       | Type                           | Default  | Description                                         |
| ------------ | ------------------------------ | -------- | --------------------------------------------------- |
| `apiKey`     | `string`                       | Required | Your Cartesia API key                               |
| `modelId`    | `string`                       | Required | Cartesia model ID to use                            |
| `voiceId`    | `string`                       | Required | Voice ID for speech synthesis                       |
| `language`   | `CartesiaLanguage`             | Optional | Language code for speech                            |
| `speed`      | `'fast' \| 'normal' \| 'slow'` | Optional | Speech speed                                        |
| `retryDelay` | `number`                       | `500`    | Delay in milliseconds between reconnection attempts |

### Supported Languages

The package supports the following languages:

| Code | Language | Code | Language   | Code | Language |
| ---- | -------- | ---- | ---------- | ---- | -------- |
| `en` | English  | `fr` | French     | `de` | German   |
| `es` | Spanish  | `pt` | Portuguese | `zh` | Chinese  |
| `ja` | Japanese | `hi` | Hindi      | `it` | Italian  |
| `ko` | Korean   | `nl` | Dutch      | `pl` | Polish   |
| `ru` | Russian  | `sv` | Swedish    | `tr` | Turkish  |

## Getting Started

1. Sign up for a [Cartesia account](https://cartesia.ai) and get your API key
2. Choose a model ID and voice ID from the Cartesia dashboard
3. Install the package and configure with your credentials

```typescript
import { CartesiaTTS } from '@micdrop/cartesia'

const tts = new CartesiaTTS({
  apiKey: 'your-cartesia-api-key',
  modelId: 'sonic-english', // Or sonic-multilingual for multiple languages
  voiceId: 'your-preferred-voice-id',
  language: 'en',
  speed: 'normal',
})

// Use with MicdropServer
new MicdropServer(socket, {
  tts,
  // ... other options
})
```
