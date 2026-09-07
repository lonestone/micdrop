# @micdrop/elevenlabs

[Micdrop website](https://micdrop.dev) | [Documentation](https://micdrop.dev/docs/ai-integration/provided-integrations/elevenlabs)

ElevenLabs implementation for [@micdrop/server](https://micdrop.dev/docs/server).

## Installation

```bash
npm install @micdrop/elevenlabs
```

## ElevenLabs TTS (Text-to-Speech)

### Usage with MicdropServer

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

### Usage without MicdropServer

```typescript
import { ElevenLabsTTS } from '@micdrop/elevenlabs'
import { Readable } from 'stream'

const tts = new ElevenLabsTTS({
  apiKey: process.env.ELEVENLABS_API_KEY || '',
  voiceId: '21m00Tcm4TlvDq8ikWAM',
})

// Audio is raw PCM, 16 bits, 16 kHz, mono
tts.on('Audio', (chunk) => console.log('Audio:', chunk.length, 'bytes'))
tts.on('Failed', (texts) => console.error('Failed:', texts))

tts.speak(Readable.from(['Hello! ', 'What can I do for you?']))
```

### Events

| Event    | Payload    | Description                                                              |
| -------- | ---------- | ------------------------------------------------------------------------ |
| `Audio`  | `Buffer`   | A chunk of audio, PCM 16 bits, 16 kHz, mono, ready to be played.         |
| `Failed` | `string[]` | Synthesis gave up after its retries, with the text that stayed unspoken. |

See the [TTS interface](https://micdrop.dev/docs/ai-integration/custom-integrations/custom-tts) for the full contract.

## Documentation

Read full [documentation of the ElevenLabs integration for Micdrop](https://micdrop.dev/docs/ai-integration/provided-integrations/elevenlabs) on the [website](https://micdrop.dev).

## License

MIT

## Author

Originally developed for [Raconte.ai](https://www.raconte.ai), created and open sourced by [Godefroy de Compreignac](https://github.com/Godefroy)
