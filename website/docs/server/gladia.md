---
title: '@micdrop/gladia'
---

Gladia implementation for [@micdrop/server](./overview).

This package provides high-quality real-time speech-to-text implementation using Gladia's streaming API.

## Features

- 🎤 **Real-time STT** - High-quality streaming speech-to-text with:
  - Real-time audio transcription via WebSocket
  - Support for 90+ languages with automatic language detection
  - Customizable preprocessing (audio enhancement, speech threshold)
  - Named entity recognition and sentiment analysis
  - Translation capabilities with target language selection
  - Automatic reconnection on connection loss
  - Silence detection for improved accuracy
  - High-quality PCM audio conversion (16kHz, 16-bit)

## Installation

```bash
npm install @micdrop/gladia
# or
yarn add @micdrop/gladia
# or
pnpm add @micdrop/gladia
```

## Usage

```typescript
import { GladiaSTT } from '@micdrop/gladia'
import { MicdropServer } from '@micdrop/server'

const stt = new GladiaSTT({
  apiKey: process.env.GLADIA_API_KEY || '',
})

// Use with MicdropServer
new MicdropServer(socket, {
  stt,
  // ... other options
})
```

## Options

| Option     | Type                                    | Default  | Description                                    |
| ---------- | --------------------------------------- | -------- | ---------------------------------------------- |
| `apiKey`   | `string`                                | Required | Your Gladia API key                            |
| `settings` | `DeepPartial<GladiaLiveSessionPayload>` | Optional | Advanced configuration for Gladia live session |

## Configuration Settings

The `settings` option allows you to customize various aspects of the transcription:

### Language Configuration

```typescript
const stt = new GladiaSTT({
  apiKey: 'your-api-key',
  settings: {
    language_config: {
      languages: ['en', 'fr', 'es'], // Specify target languages
      code_switching: true, // Enable automatic language switching
    },
  },
})
```

### Pre-processing Options

```typescript
const stt = new GladiaSTT({
  apiKey: 'your-api-key',
  settings: {
    pre_processing: {
      audio_enhancer: true, // Enhance audio quality
      speech_threshold: 0.7, // Adjust speech detection sensitivity (0.0-1.0)
    },
  },
})
```

### Real-time Processing Features

```typescript
const stt = new GladiaSTT({
  apiKey: 'your-api-key',
  settings: {
    realtime_processing: {
      words_accurate_timestamps: true, // Get word-level timestamps
      translation: true, // Enable translation
      translation_config: {
        target_languages: ['fr', 'es'], // Translate to French and Spanish
        model: 'enhanced', // Use enhanced translation model
      },
      named_entity_recognition: true, // Extract entities (names, places, etc.)
      sentiment_analysis: true, // Analyze sentiment
      custom_vocabulary: true, // Use custom vocabulary
      custom_vocabulary_config: {
        vocabulary: ['Micdrop', { value: 'API', pronunciations: ['A-P-I'] }],
        default_intensity: 1,
      },
    },
  },
})
```

## Supported Languages

Gladia supports 90+ languages with automatic detection. Some of the most commonly used languages include:

| Code | Language   | Code | Language   | Code | Language   |
| ---- | ---------- | ---- | ---------- | ---- | ---------- |
| `en` | English    | `es` | Spanish    | `fr` | French     |
| `de` | German     | `it` | Italian    | `pt` | Portuguese |
| `ru` | Russian    | `ja` | Japanese   | `ko` | Korean     |
| `zh` | Chinese    | `ar` | Arabic     | `hi` | Hindi      |
| `nl` | Dutch      | `pl` | Polish     | `tr` | Turkish    |
| `sv` | Swedish    | `da` | Danish     | `no` | Norwegian  |
| `fi` | Finnish    | `cs` | Czech      | `hu` | Hungarian  |
| `el` | Greek      | `he` | Hebrew     | `th` | Thai       |
| `vi` | Vietnamese | `id` | Indonesian | `ms` | Malay      |

See the [types file](https://github.com/lonestone/micdrop/blob/main/packages/gladia/src/types.ts) for the complete list of supported language codes.

## Advanced Features

### Custom Vocabulary

Improve transcription accuracy for domain-specific terms:

```typescript
const stt = new GladiaSTT({
  apiKey: 'your-api-key',
  settings: {
    realtime_processing: {
      custom_vocabulary: true,
      custom_vocabulary_config: {
        vocabulary: [
          'Micdrop',
          'WebSocket',
          {
            value: 'OAuth',
            pronunciations: ['O-Auth', 'oh-auth'],
            intensity: 2,
            language: 'en',
          },
        ],
        default_intensity: 1,
      },
    },
  },
})
```

### Translation

Real-time translation during transcription:

```typescript
const stt = new GladiaSTT({
  apiKey: 'your-api-key',
  settings: {
    realtime_processing: {
      translation: true,
      translation_config: {
        target_languages: ['fr', 'es', 'de'],
        model: 'enhanced', // 'base' or 'enhanced'
        match_original_utterances: true,
        context_adaptation: true,
        context: 'Technical software development discussion',
      },
    },
  },
})
```

## Error Handling

The package includes automatic reconnection and error handling:

- **Connection Loss**: Automatically reconnects with exponential backoff
- **API Errors**: Proper error propagation and logging
- **Audio Issues**: Graceful handling of audio stream interruptions

## License

MIT

## Author

Originally developed for [Raconte.ai](https://www.raconte.ai) and open sourced by [Lonestone](https://www.lonestone.io) ([GitHub](https://github.com/lonestone))
