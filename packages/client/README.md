# @micdrop/client

A browser library for handling real-time voice conversations with microphone and speaker management.

For server implementation, see [@micdrop/server](../server/README.md) package.

## Features

- 🎤 Real-time microphone recording with voice activity detection (VAD)
- 🔊 Advanced audio playback:
  - Streaming support via MediaSource
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

## Quick Start

```typescript
import { CallClient } from '@micdrop/client'

// Create a new call handler instance
const call = CallClient.getInstance<YourParamsType>({
  // VAD (see docs)
  vad: ['volume', 'silero'],
})

// Configure the call
call.url = 'wss://your-server.com/ws'
call.params = {
  /* your parameters (to check auth, etc) */
}

// Listen for events
call.on('StateChange', () => {
  console.log('State changed')
})
call.on('EndCall', () => {
  console.log('Call ended by assistant')
})
call.on('Error', (error) => {
  console.error('Error occurred:', error)
})

// Start the call
await call.start()

// Pause/resume
call.pause()
call.resume()

// Stop the call
await call.stop()
```

## Demo

Check out the demo implementation in the [@micdrop/demo-client](../demo-client/README.md) package. It shows:

- Setting up a React application with WebSocket communication
- Configuring the CallClient with custom parameters
- Managing microphone input and audio playback
- Handling conversation state and UI updates
- Error handling patterns

Here's a simplified version from the demo:

## Documentation

- **[CallClient](./docs/CallClient.md)** - Manages WebSocket connections, audio streaming, and conversation state

- **[MicRecorder](./docs/MicRecorder.md)** - Records audio from microphone with voice activity detection and speech events

- **[Mic](./docs/Mic.md)** - Manages microphone input devices and audio recording with real-time analysis

- **[Speaker](./docs/Speaker.md)** - Handles audio output devices and playback with analysis capabilities

## Browser Support

Requires browsers with support for:

- WebSocket API
- MediaRecorder API
- Web Audio API
- getUserMedia API

## License

MIT

## Author

Originally developed for [Raconte.ai](https://www.raconte.ai)

by [Lonestone](https://www.lonestone.io) ([GitHub](https://github.com/lonestone))
