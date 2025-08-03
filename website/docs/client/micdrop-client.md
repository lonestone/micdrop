---
title: MicdropClient Documentation
---

The `MicdropClient` class manages real-time audio communication between a client and server, handling microphone input, WebSocket connections, and audio playback. It's designed to facilitate interactive voice conversations with support for bi-directional audio streaming.

For server implementation, see [@micdrop/server](../../server/README.md) package.

## Usage Example

⚠️ In most cases, you should not use the constructor directly, but use the `Micdrop.start()` method instead (see [README](../README.md)). An instance is already created and available as `Micdrop` object.

```typescript
import { MicdropClient } from '@micdrop/client'

// Start a call
const micdrop = new MicdropClient({
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

// Start the call
// You can also pass options instead or in addition to the constructor
await micdrop.start()

// Pause/resume
micdrop.pause()
micdrop.resume()

// Stop the call
await micdrop.stop()

// Listen for state changes
micdrop.on('StateChange', (state) => {
  console.log('State:', state) // See below for state properties
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
```

## Options

You can pass options to `MicdropClient` constructor or to the `start` method:

- `url`: URL of the WebSocket server (using @micdrop/server)
- `params`: Parameters (optional) to check auth or provide other data
- `vad`: VAD configuration (see [VAD](./VAD.md) section)
- `disableInterruption`: If true, disables automatic mic muting when the assistant is speaking (default: false)
- `debugLog`: Boolean flag to enable/disable debug logging

## Events

The `MicdropClient` emits the following events:

- `EndCall`: Emitted when the call ends
- `Error`: Emitted when an error occurs, provides a `MicdropClientError` object
- `StateChange`: Emitted when any state change occurs in the handler, provides a `MicdropState` object

## Properties

Accessible properties that must not be changed:

- `vad`: The VAD instance in use
- `micRecorder`: Instance of `MicRecorder` for handling microphone input
- `micDevices`: Array of available microphone devices
- `speakerDevices`: Array of available speaker devices

## State

You can get state in multiple ways:

```typescript
// Get a specific state property
console.log('Is started', Micdrop.isStarted)

// Get the whole state
console.log('State', Micdrop.state)
console.log('Is started', Micdrop.state.isStarted)

// Listen to state changes
Micdrop.on('StateChange', (state) => {
  console.log('State:', state)
})
```

### State Properties

```typescript
interface MicdropState {
  // True if either WebSocket or microphone are in starting state
  isStarting: boolean

  // True if both WebSocket and microphone recording are active
  isStarted: boolean

  // True if the microphone is paused (muted by user)
  isPaused: boolean

  // True if the client is actively listening for user speech (not paused, not processing, not muted, not speaking)
  isListening: boolean

  // True if the call is processing (i.e. waiting for answer and audio generation)
  isProcessing: boolean

  // True if the user is currently speaking
  isUserSpeaking: boolean

  // True if the assistant is currently speaking
  isAssistantSpeaking: boolean

  // True if microphone stream is active
  isMicStarted: boolean

  // True if the microphone is muted
  isMicMuted: boolean

  // The ID of the microphone device in use
  micDeviceId: string | undefined

  // The ID of the speaker device in use
  speakerDeviceId: string | undefined

  // Array of available microphone devices
  micDevices: MediaDeviceInfo[]

  // Array of available speaker devices
  speakerDevices: MediaDeviceInfo[]

  // Array storing the conversation history
  conversation: MicdropConversation

  // The error object if an error occurred
  error: MicdropClientError | undefined
}
```

## Methods

### Core Methods

Start the call (starts the microphone and WebSocket connection):

```typescript
async start(options?: MicdropOptions): Promise<void>
```

Stop the call (stops the microphone and WebSocket connection):

```typescript
async stop(): Promise<void>
```

Pause the call (pauses the microphone and speaker):

```typescript
pause(): void
```

Resume the call (resumes the microphone):

```typescript
resume(): void
```

### Microphone Control

```typescript
async startMic(params: {
  vad?: VADConfig
  deviceId?: string
  record?: boolean
}): Promise<void>
```

Starts the microphone with optional device selection and recording control.

It can by usefull if you want to start the microphone before the call starts.

- `vad`: VAD configuration (see [VAD](./VAD.md) section)
- `deviceId`: Device ID to use for the microphone
- `record`: Boolean flag to enable/disable recording

### Devices Control

Select microphone device:

```typescript
async changeMicDevice(deviceId: string): Promise<void>
```

Select speaker device:

```typescript
async changeSpeakerDevice(deviceId: string): Promise<void>
```

Example:

```typescript
const micDeviceId = micdrop.micDevices[0].deviceId
const speakerDeviceId = micdrop.speakerDevices[0].deviceId
await micdrop.changeMicDevice(micDeviceId)
await micdrop.changeSpeakerDevice(speakerDeviceId)
```

See more complete example in demo [DevicesSettings](../../../examples/demo-client/src/DevicesSettings.tsx) component.

## Voice Activity Detection (VAD)

Micdrop uses a VAD (Voice Activity Detection) to detect speech and silence and send chunks of audio to server only when speech is detected. For detailed information about the VAD implementations and configuration options, please refer to the [VAD documentation](./VAD.md).

## Error Handling

The handler uses `MicdropClientError` for error management. Each error instance contains a specific error code that helps identify the type of error that occurred.

Example handling different error types:

```typescript
handler.on('Error', (error) => {
  switch (error.code) {
    case MicdropClientErrorCode.Mic:
      console.error('Microphone error - check permissions or hardware')
      break
    case MicdropClientErrorCode.MissingUrl:
      console.error('Missing URL - check url in Micdrop options')
      break
    case MicdropClientErrorCode.BadRequest:
      console.error('Bad request - check params in Micdrop options')
      break
    case MicdropClientErrorCode.NotFound:
      console.error('Not found - check server implementation')
      break
    case MicdropClientErrorCode.Connection:
      console.error('Connection error - check server implementation')
      break
    case MicdropClientErrorCode.InternalServer:
      console.error('Internal server error - check server logs')
      break
    case MicdropClientErrorCode.Unauthorized:
      console.error('Authentication failed - check credentials')
      break
    case MicdropClientErrorCode.Error:
      console.error('General error occurred')
      break
  }
})
```
