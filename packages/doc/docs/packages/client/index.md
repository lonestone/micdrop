# @micdrop/client

The browser implementation of [Micdrop](../../intro.md).

It is framework agnostic, you can use it with React, Vue, Angular or any other framework. See [demo-client](../../examples/demo-client.md) for a complete example with React.

For server implementation, see [@micdrop/server](../server/) package.

## Features

- 🎤 Real-time microphone recording with voice activity detection (VAD)
- 🔊 Advanced audio playbook:
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

If you work with React, you can also install [@micdrop/react](../react/) package to get ready-to-use React hooks.

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
  url: 'wss://your-server.com/call',
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

Check out the demo implementation in the [demo-client example](../../examples/demo-client.md) package. It shows:

- Setting up a React application with WebSocket communication
- Configuring the MicdropClient with custom parameters
- Managing microphone input and audio playback
- Handling conversation state and UI updates
- Error handling patterns

## API Reference

- **[MicdropClient](../../api/client/MicdropClient.md)** - Manages WebSocket connections, audio streaming, and conversation state
- **[MicRecorder](../../api/client/MicRecorder.md)** - Records audio from microphone with voice activity detection and speech events
- **[Mic](../../api/client/Mic.md)** - Manages microphone input devices and audio recording with real-time analysis
- **[Speaker](../../api/client/Speaker.md)** - Handles audio output devices and playback with analysis capabilities
- **[VAD](../../api/client/VAD.md)** - Voice Activity Detection, how to use and customize

## Browser Support

Fully supported in Chrome, Firefox, Safari and Edge.

Requires browsers with support for:

- WebSocket API
- Web Audio API
- MediaDevices API
- MediaRecorder API

## Advanced Usage

### Device Management

```typescript
// Get available devices
const micDevices = Micdrop.micDevices
const speakerDevices = Micdrop.speakerDevices

// Change devices
await Micdrop.changeMicDevice(micDevices[0].deviceId)
await Micdrop.changeSpeakerDevice(speakerDevices[0].deviceId)
```

### Voice Activity Detection

```typescript
// Configure VAD
await Micdrop.start({
  url: 'wss://localhost:8080',
  vad: {
    type: ['volume', 'silero'],
    volumeThreshold: 0.01,
    silenceTimeMs: 1000,
  },
})
```

### Error Handling

```typescript
Micdrop.on('Error', (error) => {
  switch (error.code) {
    case 'MIC_PERMISSION_DENIED':
      console.error('Microphone access denied')
      break
    case 'WEBSOCKET_CONNECTION_FAILED':
      console.error('Failed to connect to server')
      break
    default:
      console.error('Unknown error:', error)
  }
})
```

## Next Steps

- Learn about [Voice Activity Detection](./vad.md)
- Explore [React Integration](../react/)
- Check out the [Server Package](../server/)
- View [Complete Examples](../../examples/)
