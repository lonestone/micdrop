# @micdrop/elevenlabs

[Micdrop website](https://micdrop.dev) | [Documentation](https://micdrop.dev/docs/ai-integration/provided-integrations/elevenlabs)

ElevenLabs implementation for [@micdrop/server](https://micdrop.dev/docs/server).

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

## Documentation

Read full [documentation of the ElevenLabs integration for Micdrop](https://micdrop.dev/docs/ai-integration/provided-integrations/elevenlabs) on the [website](https://micdrop.dev).

## License

MIT

## Author

Originally developed for [Raconte.ai](https://www.raconte.ai) and open sourced by [Lonestone](https://www.lonestone.io) ([GitHub](https://github.com/lonestone))
