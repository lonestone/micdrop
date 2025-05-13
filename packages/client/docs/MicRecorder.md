# MicRecorder

The `MicRecorder` class provides functionality for recording audio from a microphone with voice activity detection (VAD). It uses the browser's MediaRecorder API and integrates with a VAD (Voice Activity Detection) system for speech detection.

## Overview

The `MicRecorder` class is a core component that can be used in two ways:

1. **As part of CallClient**: The `MicRecorder` is automatically managed by `CallClient` when using it for voice conversations. `CallClient` creates an instance internally and handles all the microphone setup, speech detection, and audio streaming.

2. **As a standalone component**: You can use `MicRecorder` directly if you only need microphone recording and speech detection functionality without the WebSocket communication and conversation management provided by `CallClient`.

This flexibility allows you to either use the full voice conversation capabilities through `CallClient`, or implement your own custom audio handling using just the microphone recording features of `MicRecorder`.

## Features

- Voice activity detection (VAD)
- Multiple audio format support (ogg, webm, mp4, wav)
- Event-based architecture
- Mute/unmute functionality
- State management

## Usage Example

```typescript
import { MicRecorder } from '@micdrop/client'

// Create a new recorder instance with VAD config (string, VAD instance, or array)
const recorder = new MicRecorder('volume')

// Get microphone stream
const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

// Start recording
await recorder.start(stream)

// Listen for events
recorder.on('StartSpeaking', () => {
  console.log('User started speaking')
})

recorder.on('StopSpeaking', () => {
  console.log('User stopped speaking')
})

recorder.on('Chunk', (blob: Blob) => {
  // Handle audio chunk
  console.log('Received audio chunk:', blob)
})
```

## State

The recorder maintains a state object with the following properties:

```typescript
interface MicRecorderState {
  isStarting: boolean // Whether the recorder is in the process of starting
  isStarted: boolean // Whether the recorder is currently active
  isMuted: boolean // Whether the recorder is muted
  isSpeaking: boolean // Whether speech is currently detected
}
```

## Events

The recorder emits the following events:

- `Chunk`: Emitted when a new audio chunk is available (with Blob data)
- `StartSpeaking`: Emitted when speech is detected
- `StopSpeaking`: Emitted when speech ends
- `StateChange`: Emitted when the recorder's state changes

## Methods

### `constructor(vadConfig?: VADConfig)`

Creates a new MicRecorder instance with the provided VAD config. The config can be:

- A string (`'volume'` or `'silero'`)
- A VAD instance
- An array of VAD configs for multiple VADs

### `start(stream: MediaStream): Promise<void>`

Starts the recorder with the provided audio stream.

### `stop(): void`

Stops the recorder and cleans up resources.

### `mute(): void`

Mutes the recorder (stops recording while keeping the stream active).

### `unmute(): void`

Unmutes the recorder (resumes recording).

## VAD

The `MicRecorder` class uses a VAD (Voice Activity Detection) system to detect speech. You can access the internal VAD instance via `recorder.vad` to update options or listen to VAD-specific events.

See [VAD documentation](./VAD.md) for more information and available options.

## Technical Details

- Uses a delayed stream to avoid cutting off speech at the beginning of detection
- Audio is recorded in chunks of 100ms when speech is detected
- Default audio settings: 128kbps bitrate
- Supports multiple audio formats with fallback options
