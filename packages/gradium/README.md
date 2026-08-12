# @micdrop/gradium

[Micdrop website](https://micdrop.dev) | [Documentation](https://micdrop.dev/docs/ai-integration/provided-integrations/gradium)

Gradium STT and TTS implementation for [@micdrop/server](https://micdrop.dev/docs/server).

## Installation

```bash
npm install @micdrop/gradium
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
  jsonConfig: {
    // Optional: advanced voice settings
    temp: 0.7, // Temperature (0-1.4)
    cfg_coef: 2.0, // Voice similarity (1.0-4.0)
    padding_bonus: 0, // Speed control (-4.0 to 4.0)
  },
})

// Use with MicdropServer
new MicdropServer(socket, {
  tts,
  // ... other options
})
```

## Gradium STT (Speech-to-Text)

Real-time transcription (ASR).

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

## Documentation

Read full [documentation of the Gradium integration for Micdrop](https://micdrop.dev/docs/ai-integration/provided-integrations/gradium) on the [website](https://micdrop.dev).

## License

MIT

## Author

Originally developed for [Raconte.ai](https://www.raconte.ai), created and open sourced by [Godefroy de Compreignac](https://github.com/Godefroy)
