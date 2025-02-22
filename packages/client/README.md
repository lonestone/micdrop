# @micdrop/client

A browser library for handling real-time voice conversations with microphone and speaker management.

For server implementation, see [@micdrop/server](../server/README.md) package.

## Features

- 🎤 Real-time microphone recording with voice activity detection (VAD)
- 🔊 Audio playback management
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
import { CallHandler } from '@micdrop/client'

// Create a new call handler instance
const call = new CallHandler()

// Listen for state changes
call.on('StateChange', () => {
  console.log('Call state:', call)
  /*
    {
      "conversation": [
        { "role": "assistant", "content": "Hello!" },
        { "role": "user", "content": "User Message 1" },
        { "role": "assistant", "content": "Assistant Message 1" }
      ],
      "isMicStarted": false,
      "isStarted": false,
      "isStarting": false,
      "isWSStarted": false,
      "isWSStarting": false
    }
  */

  console.log('MicRecorder state:', call.micRecorder.state)
  /*
    {
      "isStarting": false,
      "isStarted": false,
      "isMuted": false,
      "isSpeaking": false,
      "threshold": -50
    }
  */
})

// Start the call
await call.start()

// Pause/resume microphone
call.pause()
call.resume()

// Listen for end of interview
call.on('EndInterview', () => {
  console.log('Interview ended')
})

// Listen for errors
call.on('Error', (error) => {
  console.error('Error occurred:', error)
})

// Stop the call when done
await call.stop()
```

## Demo

Check out the demo implementation in the [@micdrop/demo-client](../demo-client/README.md) package. It shows:

- Setting up a React application with WebSocket communication
- Configuring the CallHandler with custom parameters
- Managing microphone input and audio playback
- Handling conversation state and UI updates
- Error handling patterns

Here's a simplified version from the demo:

## Documentation

- **[CallHandler](./docs/CallHandler.md)** - Manages WebSocket connections, audio streaming, and conversation state

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

[Lonestone](https://www.lonestone.io) ([GitHub](https://github.com/lonestone))
