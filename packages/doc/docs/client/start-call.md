# Start Call

Begin a voice conversation by starting the Micdrop client connection and microphone.

## Basic Usage

Start a call with minimal configuration:

```typescript
import { Micdrop } from '@micdrop/client'

await Micdrop.start({
  url: 'ws://localhost:8081',
})
```

## Start Options

Configure the call with various options:

```typescript
await Micdrop.start({
  // Required: WebSocket server URL
  url: 'ws://localhost:8081/',

  // Optional: Authentication and parameters
  params: {
    // You can put anything you want here and validate it on the server side
    language: 'en-US',
    userId: '123',
  },

  // Optional: Voice Activity Detection configuration
  vad: ['volume', 'silero'],

  // Optional: Disable interruption when assistant speaks
  disableInterruption: false,

  // Optional: Enable debug logging
  debugLog: true,
})
```

## Starting Microphone First

You can start the microphone before the call to ensure permissions and test audio:

```typescript
// Start microphone first
await Micdrop.startMic({
  vad: ['volume', 'silero'],
})

// Then start the call when you want
await Micdrop.start({
  url: 'ws://localhost:8081',
})
```

Starting the microphone first is not mandatory - calling `start()` will automatically start the microphone if it's not already running.

## Authentication

Pass authentication parameters to your server:

```typescript
await Micdrop.start({
  url: 'ws://localhost:8081',
  params: {
    authorization: 'Bearer your-jwt-token',
  },
})
```

The server receives these parameters and can validate them before accepting the connection.

Learn more about [Auth and parameters](../server/auth-and-parameters) on the server side.

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
})
```

## Error Handling

Handle connection and startup errors:

```typescript
try {
  await Micdrop.start({
    url: 'ws://localhost:8081',
  })
  console.log('Call started successfully!')
} catch (error) {
  console.error('Failed to start call:', error.code, error.message)

  // Handle specific error types
  if (error.code === MicdropClientErrorCode.Unauthorized) {
    // Show login dialog
  } else if (error.code === MicdropClientErrorCode.Mic) {
    // Show microphone permission help
  }
}
```

Learn more about [Error Handling](./error-handling).
