# Gradium

Gradium STT and TTS implementation for [@micdrop/server](../../server).

This package provides high-quality real-time speech-to-text and text-to-speech implementations using Gradium's WebSocket streaming API.

## Installation

```bash
npm install @micdrop/gradium
```

## Gradium STT (Speech-to-Text)

### Usage

```typescript
import { GradiumSTT } from '@micdrop/gradium'
import { MicdropServer } from '@micdrop/server'

const stt = new GradiumSTT({
  apiKey: process.env.GRADIUM_API_KEY || '',
  modelName: 'default', // Optional: model name
  inputFormat: 'pcm_16000', // Optional: audio format
  language: 'en', // Optional: language hint
  region: 'eu', // Optional: 'eu' or 'us'
})

// Use with MicdropServer
new MicdropServer(socket, {
  stt,
  // ... other options
})
```

### Options

| Option                 | Type                   | Default       | Description                                            |
| ---------------------- | ---------------------- | ------------- | ------------------------------------------------------ |
| `apiKey`               | `string`               | Required      | Your Gradium API key                                   |
| `modelName`            | `string`               | `'default'`   | Model name to use for transcription                    |
| `inputFormat`          | `GradiumInputFormat`   | `'pcm_16000'` | Audio input format of the incoming stream              |
| `language`             | `string`               | Optional      | Language hint (shortcut for `jsonConfig.language`)     |
| `region`               | `'eu' \| 'us'`         | `'eu'`        | API region (EU or US endpoint)                         |
| `jsonConfig`           | `GradiumASRJsonConfig` | Optional      | Advanced transcription configuration                   |
| `connectionTimeout`    | `number`               | `5000`        | Timeout in milliseconds for WebSocket connection       |
| `transcriptionTimeout` | `number`               | `4000`        | Timeout in milliseconds to wait for transcription      |
| `retryDelay`           | `number`               | `1000`        | Delay in milliseconds between reconnection attempts    |
| `maxRetry`             | `number`               | `3`           | Maximum number of reconnection attempts before failing |

### Advanced Transcription Configuration

The `jsonConfig` option allows you to fine-tune the transcription:

```typescript
const stt = new GradiumSTT({
  apiKey: 'your-api-key',
  jsonConfig: {
    language: 'en', // Language hint
    target_language: 'fr', // Optional: translation target language
    delay_in_frames: 16, // 0 to 80, each frame = 80ms
  },
})
```

## Gradium TTS (Text-to-Speech)

### Usage

```typescript
import { GradiumTTS } from '@micdrop/gradium'
import { MicdropServer } from '@micdrop/server'

const tts = new GradiumTTS({
  apiKey: process.env.GRADIUM_API_KEY || '',
  voiceId: 'YTpq7expH9539ERJ', // Gradium voice ID
  modelName: 'default', // Optional: model name
  outputFormat: 'pcm_16000', // Optional: audio format
  region: 'eu', // Optional: 'eu' or 'us'
})

// Use with MicdropServer
new MicdropServer(socket, {
  tts,
  // ... other options
})
```

### Options

| Option         | Type                  | Default       | Description                                            |
| -------------- | --------------------- | ------------- | ------------------------------------------------------ |
| `apiKey`       | `string`              | Required      | Your Gradium API key                                   |
| `voiceId`      | `string`              | Required      | Gradium voice ID                                       |
| `modelName`    | `string`              | `'default'`   | Model name to use for speech synthesis                 |
| `outputFormat` | `GradiumOutputFormat` | `'pcm_16000'` | Audio output format                                    |
| `region`       | `'eu' \| 'us'`       | `'eu'`        | API region (EU or US endpoint)                         |
| `jsonConfig`        | `GradiumJsonConfig`   | Optional      | Advanced voice configuration                           |
| `connectionTimeout` | `number`              | `5000`        | Timeout in milliseconds for WebSocket connection       |
| `retryDelay`        | `number`              | `1000`        | Delay in milliseconds between reconnection attempts    |
| `maxRetry`     | `number`              | `3`           | Maximum number of reconnection attempts before failing |

### Output Formats

| Format      | Description                              |
| ----------- | ---------------------------------------- |
| `pcm`       | PCM 48kHz, 16-bit signed integer mono    |
| `pcm_16000` | PCM 16kHz, 16-bit signed integer mono    |
| `pcm_24000` | PCM 24kHz, 16-bit signed integer mono    |
| `pcm_8000`  | PCM 8kHz, 16-bit signed integer mono     |
| `wav`       | WAV format                               |
| `opus`      | Opus codec wrapped in an Ogg container   |
| `ulaw_8000` | u-law 8kHz                               |
| `alaw_8000` | A-law 8kHz                               |

### Advanced Voice Configuration

The `jsonConfig` option allows you to fine-tune voice characteristics:

```typescript
const tts = new GradiumTTS({
  apiKey: 'your-api-key',
  voiceId: 'your-voice-id',
  jsonConfig: {
    temp: 0.7, // Temperature: 0 to 1.4 (default: 0.7)
    cfg_coef: 2.0, // Voice similarity: 1.0 to 4.0 (default: 2.0)
    padding_bonus: 0, // Speed control: -4.0 to 4.0
  },
})
```

| Parameter       | Type     | Range        | Default | Description                                |
| --------------- | -------- | ------------ | ------- | ------------------------------------------ |
| `temp`          | `number` | 0 - 1.4     | 0.7     | Controls randomness in speech generation   |
| `cfg_coef`      | `number` | 1.0 - 4.0   | 2.0     | Controls similarity to the original voice  |
| `padding_bonus` | `number` | -4.0 - 4.0  | 0       | Controls speech speed                      |

## Getting Started

1. Sign up for a [Gradium account](https://gradium.ai) and get your API key
2. Choose a voice ID from the Gradium voice library
3. Install the package and configure with your credentials

```typescript
import { GradiumTTS } from '@micdrop/gradium'

const tts = new GradiumTTS({
  apiKey: 'your-gradium-api-key',
  voiceId: 'your-voice-id',
  region: 'eu', // Use 'us' for US endpoint
  outputFormat: 'pcm_16000',
})

// Use with MicdropServer
new MicdropServer(socket, {
  tts,
  // ... other options
})
```
