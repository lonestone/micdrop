# @micdrop/kokoro

[Micdrop website](https://micdrop.dev) | [Documentation](https://micdrop.dev/docs/ai-integration/provided-integrations/kokoro)

Local Kokoro text to speech for [@micdrop/server](https://micdrop.dev/docs/server).

Runs in your Node process through Transformers.js and ONNX Runtime, so there is
no API key, no server to start next to your own, and no text leaving the
machine. Kokoro is an 82 million parameter model with a quality well above what
its size suggests.

Kokoro only speaks English here, since `kokoro-js` phonemizes every input with
the English rules. Use [@micdrop/piper](https://micdrop.dev/docs/ai-integration/provided-integrations/piper) for the other languages.

## Installation

```bash
npm install @micdrop/kokoro
```

## Usage

```typescript
import { KokoroTTS } from '@micdrop/kokoro'
import { MicdropServer } from '@micdrop/server'

const tts = new KokoroTTS({
  voice: 'britishFemale', // or any Kokoro voice id, such as af_heart
})

// Use with MicdropServer
new MicdropServer(socket, {
  tts,
  // ... other options
})
```

## Documentation

Read full [documentation of the Kokoro integration for Micdrop](https://micdrop.dev/docs/ai-integration/provided-integrations/kokoro) on the [website](https://micdrop.dev), and the [guide on running Micdrop with local models](https://micdrop.dev/docs/ai-integration/local-models).

## License

MIT

## Author

Originally developed for [Raconte.ai](https://www.raconte.ai), created and open sourced by [Godefroy de Compreignac](https://github.com/Godefroy)
