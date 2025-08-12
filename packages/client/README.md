# 🖐️🎤 Micdrop: Real-Time Voice Conversations with AI

Micdrop is a set of open source Typescript packages to build real-time voice conversations with AI agents. It handles all the complexities on the browser and server side (microphone, speaker, VAD, network communication, etc) and provides ready-to-use implementations for various AI providers.

# @micdrop/client

The browser implementation of [Micdrop](../../README.md).

It is framework agnostic, you can use it with React, Vue, Angular or any other framework. See [demo-client](../../examples/demo-client/README.md) for a complete example with React.

For server implementation, see [@micdrop/server](../server/README.md) package.

## Features

- 🎤 Real-time microphone recording with voice activity detection (VAD)
- 🔊 Advanced audio playback:
  - Streaming support
  - Pause/resume functionality
  - Volume control
  - Device selection and testing
  - Real-time audio analysis
- 🌐 WebSocket-based audio streaming
- 📊 Audio analysis and volume monitoring
- 🎛️ Configurable speech detection settings
- ⚡ Event-based architecture
- 🔇 Mute/unmute functionality

## Installation

```bash
npm install @micdrop/client
# or
yarn add @micdrop/client
# or
pnpm add @micdrop/client
```

If you work with React, you can also install [@micdrop/react](../react/README.md) package to get a ready-to-use React hooks.

## Quick Start

### Start a call

`Micdrop` is a singleton instance of `MicdropClient` that can be used to start, stop and manage a call.

```typescript
import { Micdrop } from '@micdrop/client'

// Start a call
await Micdrop.start({
  url: 'wss://your-server.com/call',
})
```

### Control the call

```typescript
// Pause/resume
Micdrop.pause()
Micdrop.resume()

// Stop the call
await Micdrop.stop()
```

### Listen for events

You can listen for events to get the state of the call and handle errors.

```typescript
Micdrop.on('StateChange', () => {
  console.log('State changed')
})
Micdrop.on('EndCall', () => {
  console.log('Call ended by assistant')
})
Micdrop.on('Error', (error) => {
  console.error('Error occurred:', error)
})
```

### Complete Example

```typescript
import { Micdrop } from '@micdrop/client'

// Start a call
await Micdrop.start({
  // URL of the WebSocket server (using @micdrop/server)
  url: 'wss://your-server.com/ws',
  // Parameters (optional) to check auth or provide other data
  params: {
    authorization: '1234',
    lang: navigator.language,
  },
  // Voice Activity Detection (see docs)
  vad: ['volume', 'silero'],
  // Disable ability for the user to interrupt the assistant when it is speaking
  disableInterruption: true,
  // Enable debug logging
  debugLog: true,
})

// Listen for events
Micdrop.on('StateChange', (state) => {
  console.log('State:', state)
})
Micdrop.on('EndCall', () => {
  console.log('Call ended by assistant')
})
Micdrop.on('Error', (error) => {
  console.error('Error occurred:', error)
})

// Pause/resume
Micdrop.pause()
Micdrop.resume()

// Stop the call
await Micdrop.stop()
```

## Demo

Check out the demo implementation in the [demo-client example](../../examples/demo-client/README.md) package. It shows:

- Setting up a React application with WebSocket communication
- Configuring the MicdropClient with custom parameters
- Managing microphone input and audio playback
- Handling conversation state and UI updates
- Error handling patterns

## Documentation

- **[MicdropClient](./docs/MicdropClient.md)** - Manages WebSocket connections, audio streaming, and conversation state

- **[MicRecorder](./docs/MicRecorder.md)** - Records audio from microphone with voice activity detection and speech events

- **[Mic](./docs/Mic.md)** - Manages microphone input devices and audio recording with real-time analysis

- **[Speaker](./docs/Speaker.md)** - Handles audio output devices and playback with analysis capabilities

- **[VAD](./docs/VAD.md)** - Voice Activity Detection, how to use and customize

## Browser Support

Fully supported in Chrome, Firefox, Safari and Edge.

Requires browsers with support for:

- WebSocket API
- Web Audio API
- MediaDevices API
- MediaRecorder API

## License

MIT

## Author

Originally developed for [Raconte.ai](https://www.raconte.ai) and open sourced by [Lonestone](https://www.lonestone.io) ([GitHub](https://github.com/lonestone))
