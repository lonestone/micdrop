# @micdrop/gladia

[Micdrop website](https://micdrop.dev) | [Documentation](https://micdrop.dev/docs/ai-integration/provided-integrations/gladia)

Gladia implementation for [@micdrop/server](https://micdrop.dev/docs/server).

## Installation

```bash
npm install @micdrop/gladia
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

## Documentation

Read full [documentation of the Gladia integration for Micdrop](https://micdrop.dev/docs/ai-integration/provided-integrations/gladia) on the [website](https://micdrop.dev).

## License

MIT

## Author

Originally developed for [Raconte.ai](https://www.raconte.ai) and open sourced by [Lonestone](https://www.lonestone.io) ([GitHub](https://github.com/lonestone))
