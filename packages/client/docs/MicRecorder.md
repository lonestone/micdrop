# MicRecorder

The `MicRecorder` class provides functionality for recording audio from a microphone with voice activity detection (VAD). It uses the browser's MediaRecorder API and the `hark` library for speech detection.

## Overview

The `MicRecorder` class is a core component that can be used in two ways:

1. **As part of CallHandler**: The `MicRecorder` is automatically managed by `CallHandler` when using it for voice conversations. `CallHandler` creates an instance internally and handles all the microphone setup, speech detection, and audio streaming.

2. **As a standalone component**: You can use `MicRecorder` directly if you only need microphone recording and speech detection functionality without the WebSocket communication and conversation management provided by `CallHandler`.

This flexibility allows you to either use the full voice conversation capabilities through `CallHandler`, or implement your own custom audio handling using just the microphone recording features of `MicRecorder`.

## Features

- Voice activity detection (VAD)
- Configurable speech detection threshold
- Multiple audio format support (ogg, webm, mp4, wav)
- Event-based architecture
- Mute/unmute functionality
- State management

## Usage

```typescript
import { MicRecorder } from '../audio/MicRecorder'

// Create a new instance
const recorder = new MicRecorder()

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
  threshold: number // Speech detection threshold
}
```

## Events

The recorder emits the following events:

- `Chunk`: Emitted when a new audio chunk is available (with Blob data)
- `StartSpeaking`: Emitted when speech is detected
- `StopSpeaking`: Emitted when speech ends
- `StateChange`: Emitted when the recorder's state changes

## Methods

### `start(stream: MediaStream): Promise<void>`

Starts the recorder with the provided audio stream.

### `stop(): void`

Stops the recorder and cleans up resources.

### `mute(): void`

Mutes the recorder (stops recording while keeping the stream active).

### `unmute(): void`

Unmutes the recorder (resumes recording).

### `setThreshold(threshold: number): void`

Sets the speech detection threshold. Lower values make speech detection more sensitive.

## Technical Details

- Uses a delayed stream to avoid cutting off speech at the beginning of detection
- Audio is recorded in chunks of 500ms when speech is detected
- Default audio settings: 128kbps bitrate
- Supports multiple audio formats with fallback options
- Persists threshold settings in localStorage

## Example Implementation

```typescript
const recorder = new MicRecorder()

recorder.on('Chunk', this.handleAudioChunk)
recorder.on('StartSpeaking', this.handleStartSpeaking)
recorder.on('StopSpeaking', this.handleStopSpeaking)

// Start recording
const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
await recorder.start(stream)
```

## Notes

- Ensure proper cleanup by calling `stop()` when the recorder is no longer needed
- Handle errors appropriately as audio recording may fail due to permissions or hardware issues
- The speech detection threshold can be adjusted based on environmental conditions
