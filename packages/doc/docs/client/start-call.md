# Start Call

Begin a voice conversation by starting the Micdrop client connection and microphone.

## Basic Usage

Start a call with minimal configuration:

```typescript
import { Micdrop } from '@micdrop/client'

await Micdrop.start({
  url: 'ws://localhost:8080'
})
```

## Start Options

Configure the call with various options:

```typescript
await Micdrop.start({
  // Required: WebSocket server URL
  url: 'ws://your-server.com/ws',
  
  // Optional: Authentication and parameters
  params: {
    authorization: 'your-auth-token',
    language: 'en-US',
    userId: '123'
  },
  
  // Optional: Voice Activity Detection configuration
  vad: ['volume', 'silero'],
  
  // Optional: Disable interruption when assistant speaks
  disableInterruption: false,
  
  // Optional: Enable debug logging
  debugLog: true
})
```

## Starting Microphone First

You can start the microphone before the call to ensure permissions and test audio:

```typescript
// Start microphone first (optional but recommended)
await Micdrop.startMic({
  vad: ['volume', 'silero'],
  deviceId: 'specific-mic-device-id', // optional
  record: true // optional, default: true
})

// Then start the call
await Micdrop.start({
  url: 'ws://localhost:8080'
})
```

Starting the microphone first is not mandatory - calling `start()` will automatically start the microphone if it's not already running.

## Authentication

Pass authentication parameters to your server:

```typescript
await Micdrop.start({
  url: 'ws://localhost:8080',
  params: {
    authorization: 'Bearer your-jwt-token',
    userId: 'user-123',
    sessionId: 'session-456'
  }
})
```

The server receives these parameters and can validate them before accepting the connection.

## Error Handling

Handle connection and startup errors:

```typescript
try {
  await Micdrop.start({
    url: 'ws://localhost:8080'
  })
  console.log('Call started successfully!')
} catch (error) {
  console.error('Failed to start call:', error.message)
  
  // Handle specific error types
  if (error.code === 'UNAUTHORIZED') {
    // Show login dialog
  } else if (error.code === 'MIC_PERMISSION_DENIED') {
    // Show microphone permission help
  }
}
```

## State Monitoring

Listen for state changes during startup:

```typescript
Micdrop.on('StateChange', (state) => {
  if (state.isStarting) {
    console.log('Starting call...')
  }
  
  if (state.isStarted) {
    console.log('Call started! Ready for conversation.')
  }
  
  if (state.isListening) {
    console.log('🎤 Listening for your voice...')
  }
})

await Micdrop.start({
  url: 'ws://localhost:8080'
})
```

## Advanced Configuration

Customize VAD settings and behavior:

```typescript
await Micdrop.start({
  url: 'ws://localhost:8080',
  
  // Multiple VAD algorithms for better accuracy
  vad: ['volume', 'silero'],
  
  // Prevent user from interrupting assistant
  disableInterruption: true,
  
  // Custom parameters sent to server
  params: {
    model: 'gpt-4',
    voice: 'alloy',
    language: navigator.language,
    temperature: 0.7
  }
})
```

## Next Steps

- [**Pause/Resume Call**](./pause-resume-call) - Control conversation flow
- [**Voice Activity Detection**](./vad) - Configure speech detection
- [**Device Management**](./devices-management) - Select microphone/speaker