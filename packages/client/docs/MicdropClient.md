# MicdropClient Documentation

The `MicdropClient` class manages real-time audio communication between a client and server, handling microphone input, WebSocket connections, and audio playback. It's designed to facilitate interactive voice conversations with support for bi-directional audio streaming.

## Usage Example

```typescript
import { MicdropClient } from '@micdrop/client'

// Get the singleton instance with your params type and options
const micdrop = MicdropClient.getInstance<YourParamsType>({
  vad: ['silero', 'volume'], // or 'volume', or an instance, or array (see VAD section)
  disableInterruption: true, // disables mic interruption when assistant is speaking
})

// Configure the micdrop
micdrop.url = 'wss://your-server.com/ws'
micdrop.params = {
  /* your parameters (to check auth, etc) */
}

// Listen for state changes
micdrop.on('StateChange', () => {
  console.log('State:', micdrop)
  /*
    {
      "conversation": [
        { "role": "assistant", "content": "Hello!" },
        { "role": "user", "content": "User Message 1" },
        { "role": "assistant", "content": "Assistant Message 1" }
      ],
      "isStarted": false,
      "isStarting": false,
      "isWSStarted": false,
      "isWSStarting": false,
      "isProcessing": false,
      "isListening": false,
      "isPaused": false,
      "isMicStarted": false,
      "isMicMuted": false,
      "isUserSpeaking": false,
      "isAssistantSpeaking": false,
    }
  */
})

// Listen for end of call
// Can be triggered via prompting (see server docs)
micdrop.on('EndCall', () => {
  console.log('Call ended by assistant')
})

// Listen for errors
micdrop.on('Error', (error) => {
  console.error('Error occurred:', error)
})

// Start the call
await micdrop.start()

// Pause/resume
micdrop.pause()
micdrop.resume()

// Stop the call
await micdrop.stop()
```

## Options

You can pass an options object to `MicdropClient.getInstance`:

- `vad`: VAD configuration (see [VAD](./VAD.md) section)
- `disableInterruption`: If true, disables automatic mic muting when the assistant is speaking (default: false)

## Events

The `MicdropClient` emits the following events:

- `EndCall`: Emitted when the call ends
- `Error`: Emitted when an error occurs, provides a `MicdropClientError` object
- `StateChange`: Emitted when any state change occurs in the handler

## Properties

### Public Properties

Params that can be changed before starting the call:

- `url`: WebSocket URL for the connection
- `params`: Generic type parameters for the handler
- `debug`: Boolean flag to enable/disable debug logging

Accessible properties that must not be changed:

- `micRecorder`: Instance of `MicRecorder` for handling microphone input (do not change)
- `vad`: The VAD instance in use (do not change)
- `conversation`: Array storing the conversation history (do not change)

### State Properties (Getters)

- `isStarted`: Returns true if both WebSocket and microphone recording are active
- `isStarting`: Returns true if either WebSocket or microphone are in starting state
- `isWSStarted`: Returns true if WebSocket connection is open
- `isWSStarting`: Returns true if WebSocket is connecting
- `isMicStarted`: Returns true if microphone stream is active
- `isMicMuted`: Returns true if the microphone is muted
- `isListening`: Returns true if the client is actively listening for user speech (not paused, not processing, not muted, not speaking)
- `isProcessing`: Returns true if the call is processing (i.e. waiting for answer and audio generation)
- `isPaused`: Returns true if the microphone is paused (muted by user)
- `isUserSpeaking`: Returns true if the user is currently speaking
- `isAssistantSpeaking`: Returns true if the assistant is currently speaking

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

```typescript
async destroy(): Promise<void>
```

Cleans up all listeners and resources. Call this if you want to fully dispose the singleton and reset state.

### Microphone Control

```typescript
async startMic(deviceId?: string, record = true): Promise<void>
```

Starts the microphone with optional device selection and recording control.

## VAD

Micdrop uses a VAD (Voice Activity Detection) to detect speech and silence and send chunks of audio to server only when speech is detected. For detailed information about the VAD implementations and configuration options, please refer to the [VAD documentation](./VAD.md).

## Error Handling

The handler uses `MicdropClientError` for error management. Each error instance contains a specific error code that helps identify the type of error that occurred.

The `MicdropClientError` can have the following codes:

- `MicdropClientErrorCode.Mic`: Indicates an error with microphone access or recording. This can occur when:

  - Microphone permissions are denied
  - No microphone is available
  - Hardware issues prevent microphone access
  - Recording fails to start

- `MicdropClientErrorCode.Unauthorized`: Indicates authentication or authorization failure with the WebSocket connection. This occurs when:

  - Invalid credentials are provided
  - Session has expired
  - Access token is invalid
  - User doesn't have required permissions

- `MicdropClientErrorCode.Error`: General error code for other types of failures (default). This includes:
  - WebSocket connection failures
  - Network issues
  - Server-side errors
  - Unexpected runtime errors

Example handling different error types:

```typescript
handler.on('Error', (error: MicdropClientError) => {
  switch (error.code) {
    case MicdropClientErrorCode.Mic:
      console.error('Microphone error - check permissions or hardware')
      // Handle microphone-specific error recovery
      break
    case MicdropClientErrorCode.Unauthorized:
      console.error('Authentication failed - check credentials')
      // Handle authentication retry or user logout
      break
    case MicdropClientErrorCode.Error:
      console.error('General error occurred')
      // Handle general error recovery
      break
  }
})
```
