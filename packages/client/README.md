# 🖐️🎤 Micdrop: Real-Time Voice Conversations with AI

[Micdrop website](https://micdrop.dev) | [Documentation](https://micdrop.dev/docs/client) | [Demo](../../examples/demo-client)

Micdrop is a set of open source Typescript packages to build real-time voice conversations with AI agents. It handles all the complexities on the browser and server side (microphone, speaker, VAD, network communication, etc) and provides ready-to-use implementations for various AI providers.

# @micdrop/client

The browser implementation of [Micdrop](https://micdrop.dev).

It is framework agnostic, you can use it with React, Vue, Angular or any other framework. See [demo-client](../../examples/demo-client) for a complete example with React.

For server implementation, see [@micdrop/server](https://micdrop.dev/docs/server).

## Features

- 🎤 Real-time microphone recording and playback
- 🗣️ Voice activity detection (VAD)
- 🔊 Devices selection and testing
- 🔌 Full state and events for UI integration
- 🌐 WebSocket-based audio streaming

## Installation

```bash
npm install @micdrop/client
```

If you're using React, you can also install [@micdrop/react](https://micdrop.dev/docs/client/react-hooks) package to get a ready-to-use React hooks.

## Quick Start

```typescript
import { Micdrop } from '@micdrop/client'

// Start a call
Micdrop.start({
  url: 'wss://your-server.com/call',
})
```

## Documentation

Read full [documentation of the Micdrop client](https://micdrop.dev/docs/client) on the [website](https://micdrop.dev).

## License

MIT

## Author

Originally developed for [Raconte.ai](https://www.raconte.ai) and open sourced by [Lonestone](https://www.lonestone.io) ([GitHub](https://github.com/lonestone))
