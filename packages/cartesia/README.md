# @micdrop/cartesia

[Micdrop website](https://micdrop.dev) | [Documentation](https://micdrop.dev/docs/ai-integration/provided-integrations/cartesia)

Cartesia implementation for [@micdrop/server](https://micdrop.dev/docs/server).

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

## Documentation

Read full [documentation of the Cartesia integration for Micdrop](https://micdrop.dev/docs/ai-integration/provided-integrations/cartesia) on the [website](https://micdrop.dev).

## License

MIT

## Author

Originally developed for [Raconte.ai](https://www.raconte.ai) and open sourced by [Lonestone](https://www.lonestone.io) ([GitHub](https://github.com/lonestone))
