# CallClient Documentation

The `CallClient` class manages real-time audio communication between a client and server, handling microphone input, WebSocket connections, and audio playback. It's designed to facilitate interactive voice conversations with support for bi-directional audio streaming.

## Usage Example

```typescript
import { CallClient } from '@micdrop/client'

// Get the singleton instance with your params type
const call = CallClient.getInstance<YourParamsType>()

// Configure the call
call.url = 'wss://your-server.com/ws'
call.params = {
  /* your parameters (to check auth, etc) */
}

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
      "isWSStarting": false,
      "isProcessing": false
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

// Listen for end of call
// Can be triggered via prompting (see server docs)
call.on('EndCall', () => {
  console.log('Call ended by assistant')
})

// Listen for errors
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

## Events

The `CallClient` emits the following events:

- `EndCall`: Emitted when the call ends
- `Error`: Emitted when an error occurs, provides a `CallClientError` object
- `StateChange`: Emitted when any state change occurs in the handler

## Properties

### Public Properties

- `url`: WebSocket URL for the connection
- `params`: Generic type parameters for the handler
- `micRecorder`: Instance of `MicRecorder` for handling microphone input
- `conversation`: Array storing the conversation history
- `debug`: Boolean flag to enable/disable debug logging

### Static Methods

```typescript
static getInstance<T extends {}>(): CallClient<T>
```

Gets the singleton instance of the CallClient. Creates a new instance if one doesn't exist.

### State Properties (Getters)

- `isStarted`: Returns true if both WebSocket and microphone recording are active
- `isStarting`: Returns true if either WebSocket or microphone are in starting state
- `isWSStarted`: Returns true if WebSocket connection is open
- `isWSStarting`: Returns true if WebSocket is connecting
- `isMicStarted`: Returns true if microphone stream is active
- `isProcessing`: Returns true if the call is processing (i.e. waiting for answer and audio generation)

## Methods

### Core Methods

```typescript
async start(): Promise<void>
```

Initializes the handler by starting the microphone and WebSocket connection.

```typescript
async stop(): Promise<void>
```

Stops all active connections and recordings.

```typescript
pause(): void
```

Mutes the microphone input while maintaining connections.

```typescript
resume(): void
```

Unmutes the microphone and resumes audio playback if available.

### Microphone Control

```typescript
async startMic(deviceId?: string, record = true): Promise<void>
```

Starts the microphone with optional device selection and recording control.

## VAD

Micdrop uses a VAD (Voice Activity Detection) to detect speech and silence and send chunks of audio to server only when speech is detected. For detailed information about the VAD implementations and configuration options, please refer to the [VAD documentation](./VAD.md).

## Error Handling

The handler uses `CallClientError` for error management. Each error instance contains a specific error code that helps identify the type of error that occurred.

The `CallClientError` can have the following codes:

- `CallClientErrorCode.Mic`: Indicates an error with microphone access or recording. This can occur when:

  - Microphone permissions are denied
  - No microphone is available
  - Hardware issues prevent microphone access
  - Recording fails to start

- `CallClientErrorCode.Unauthorized`: Indicates authentication or authorization failure with the WebSocket connection. This occurs when:

  - Invalid credentials are provided
  - Session has expired
  - Access token is invalid
  - User doesn't have required permissions

- `CallClientErrorCode.Error`: General error code for other types of failures (default). This includes:
  - WebSocket connection failures
  - Network issues
  - Server-side errors
  - Unexpected runtime errors

Example handling different error types:

```typescript
handler.on('Error', (error: CallClientError) => {
  switch (error.code) {
    case CallClientErrorCode.Mic:
      console.error('Microphone error - check permissions or hardware')
      // Handle microphone-specific error recovery
      break
    case CallClientErrorCode.Unauthorized:
      console.error('Authentication failed - check credentials')
      // Handle authentication retry or user logout
      break
    case CallClientErrorCode.Error:
      console.error('General error occurred')
      // Handle general error recovery
      break
  }
})
```
