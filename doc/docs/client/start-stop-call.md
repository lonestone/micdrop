# Start/Stop Call

Manage voice conversations by starting and stopping the Micdrop client connection and microphone.

## Starting a Call

Begin a voice conversation by starting the Micdrop client connection and microphone.

### Basic Usage

Start a call with minimal configuration:

```typescript
import { Micdrop } from '@micdrop/client'

await Micdrop.start({
  url: 'ws://localhost:8081',
})
```

### Start Options

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

  // Optional: Automatic reconnection configuration
  reconnect: {
    maxAttempts: 10, // Maximum reconnection attempts (default: Infinity)
    delayMs: 500, // Delay between reconnection attempts in ms (default: 1000)
  },
})
```

### Starting Microphone First

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

### Authentication

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

### Start State Monitoring

Listen for state changes during startup:

```typescript
Micdrop.on('StateChange', (state, prevState) => {
  if (state.isStarting && !prevState.isStarting) {
    console.log('Starting call...')
  }

  if (state.isStarted && !prevState.isStarted) {
    console.log('Call started! Ready for conversation.')
  }

  if (state.isReconnecting && !prevState.isReconnecting) {
    console.log('Connection lost. Attempting to reconnect...')
  }
})
```

### Start Error Handling

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
  switch (error.code) {
    case 'Unauthorized':
      // Show login dialog
      break
    case 'Mic':
      // Show microphone permission help
      break
    case 'MissingUrl':
      // Show help to set the url
      break
    case 'Connection':
      // Show help to check the connection
      break
    case 'InternalServer':
      // Show help to check the server
      break
    case 'BadRequest':
      // Show help to check the request
      break
    case 'NotFound':
      // Show help to check the server
      break
    case 'Unknown':
      // Show help to check the request
      break
    default:
      break
  }
}
```

Learn more about [Error Handling](./error-handling).

## Stopping a Call

End the voice conversation by stopping the microphone, closing the WebSocket connection, and cleaning up resources.

### Basic Usage

Stop the current call and clean up all resources:

```typescript
import { Micdrop } from '@micdrop/client'

// Stop the call
await Micdrop.stop()

console.log('Call stopped:', !Micdrop.isStarted) // true
```

When stopped:

- 🛑 Microphone recording ends
- 🛑 WebSocket connection closes
- 🛑 Audio processing stops
- 🛑 All event listeners are cleaned up
- 🛑 VAD algorithms are stopped

### Graceful Stop

Wait for current operations to complete before stopping:

```typescript
async function gracefulStop() {
  if (!Micdrop.isAssistantSpeaking) {
    Micdrop.stop()
    console.log('Call stopped immediately')
  } else {
    // Wait for assistant to finish, then stop
    const handler = (state: MicdropState) => {
      if (!state.isAssistantSpeaking) {
        Micdrop.stop()
        Micdrop.off('StateChange', handler)
        console.log('Call stopped gracefully')
      }
    }
    Micdrop.on('StateChange', handler)
  }
}
```

### Stop State Monitoring

Monitor the stop process:

```typescript
Micdrop.on('StateChange', (state) => {
  if (!state.isStarted && !state.isStarting) {
    console.log('✅ Call fully stopped')
    // Update UI to show stopped state
    updateCallButton('Start Call', 'green')
  }
})

await Micdrop.stop()
```

### Auto-stop on EndCall event

You may want the assistant to be able to end the call, for example when the user says "Bye bye".

The [agent](../ai-integration/custom-integrations/custom-agent.md) can send an `EndCall` that can be listened to by the client.

```typescript
Micdrop.on('EndCall', () => {
  console.log('🔚 Call ended by assistant')
  Micdrop.stop()
})
```

You can gracefully stop the call by waiting for the assistant to finish speaking (see above).

## UI Integration

Create start/stop controls in your interface:

```typescript
// Button handler for start/stop toggle
function toggleStartStop() {
  if (Micdrop.isStarted) {
    Micdrop.stop()
    document.getElementById('startStopBtn').textContent = 'Start'
  } else {
    Micdrop.start()
    document.getElementById('startStopBtn').textContent = 'Stop'
  }
}
```

React example:

```tsx
import { useMicdropState } from '@micdrop/react'

function CallControls() {
  const state = useMicdropState()

  const handleStart = () => Micdrop.start({ url: 'ws://localhost:8081/' })
  const handleStop = () => Micdrop.stop()

  return (
    <button onClick={state.isStarted ? handleStop : handleStart}>
      {state.isStarted ? '⏸️ Stop' : '▶️ Start'}
    </button>
  )
}
```
