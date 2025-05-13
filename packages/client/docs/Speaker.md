# Speaker

The Speaker module provides functionality for managing audio output devices and playing audio in the browser.

## Features

- 🔊 Audio output device management
- 🎵 Streaming audio playback
- 📊 Real-time audio analysis
- 💾 Persistent device selection
- 🔄 Dynamic device switching
- ⏯️ Playing state events
- 🚦 Streaming mode toggle

## Usage Example

```typescript
import { Speaker } from '@micdrop/client'

// Check if device selection is supported
if (Speaker.canChangeDevice()) {
  // Change to a specific output device
  await Speaker.changeDevice('device-id')
}

// Play an audio blob
const audioBlob = new Blob(
  [
    /* audio data */
  ],
  { type: 'audio/mpeg' }
)
await Speaker.playAudio(audioBlob)

// Pause playback
Speaker.pauseAudio()

// Monitor volume changes using the audio analyser
// Volume is in dB range -100 to 0
Speaker.analyser.on('volume', (volume: number) => {
  // Convert to 0-100 range for visualization if needed
  const normalizedVolume = Math.max(0, volume + 100)
  console.log('Current volume:', normalizedVolume)
})

// Listen for playing events
Speaker.on('StartPlaying', () => {
  console.log('Speaker started playing')
})
Speaker.on('StopPlaying', () => {
  console.log('Speaker stopped playing')
})

// Resume playback
Speaker.resumeAudio()

// Stop playback and cleanup
Speaker.stopAudio()
```

## API Reference

### Properties

#### `isPlaying: boolean`

Indicates whether audio is currently being played through the speaker.

```typescript
if (Speaker.isPlaying) {
  console.log('Speaker is currently playing audio')
}
```

#### `isStreamingEnabled: boolean`

Indicates whether streaming playback mode is enabled.

```typescript
console.log('Streaming enabled:', Speaker.isStreamingEnabled)
```

#### `analyser: AudioAnalyser`

An instance of `AudioAnalyser` that can be used to analyze the audio output.

```typescript
Speaker.analyser.on('volume', (volume: number) => {
  console.log('Current volume:', volume)
})

// Access the underlying AnalyserNode
console.log(Speaker.analyser.node)
```

### Functions

#### `canChangeDevice(): boolean`

Checks if the browser supports changing audio output devices.

```typescript
console.log(Speaker.canChangeDevice())
```

Returns `true` if the browser supports changing audio output devices, `false` otherwise.

#### `changeDevice(speakerId: string): Promise<void>`

Changes the current audio output device.

```typescript
await Speaker.changeDevice(deviceId)
```

- `speakerId`: The ID of the audio output device to use
- Saves the selected device ID to local storage
- Automatically initializes audio pipeline if needed

#### `playAudio(blob: Blob): Promise<void>`

Plays an audio blob through the current audio output device using MediaSource Extensions.

```typescript
await Speaker.playAudio(audioBlob)
```

- `blob`: The audio blob to play
- Queues blobs for continuous playback
- Automatically handles audio pipeline initialization
- Connects to audio analyser for visualization (see `analyser`)
- Supports streaming playback with automatic buffer management

#### `pauseAudio(): void`

Pauses the currently playing audio.

```typescript
Speaker.pauseAudio()
```

- Pauses playback while maintaining the audio pipeline
- Can be resumed using `resumeAudio()`

#### `resumeAudio(): void`

Resumes paused audio playback.

```typescript
Speaker.resumeAudio()
```

- Resumes playback from where it was paused

#### `stopAudio(): void`

Stops audio playback and cleans up resources.

```typescript
Speaker.stopAudio()
```

- Stops playback completely
- Cleans up all audio resources including MediaSource and buffers
- Disconnects from audio analyser
- Stops and cleans up any active media streams

#### `enableStreaming(): Promise<void>`

Enables streaming playback mode. In streaming mode, audio is played using MediaSource Extensions for efficient streaming and buffering.

```typescript
await Speaker.enableStreaming()
```

#### `disableStreaming(): Promise<void>`

Disables streaming playback mode. Switches to non-streaming playback.

```typescript
await Speaker.disableStreaming()
```

### Events

The Speaker emits events for playing state changes. You can listen to these events using `.on()`:

#### `StartPlaying`

Emitted when audio playback starts.

#### `StopPlaying`

Emitted when audio playback stops.

```typescript
Speaker.on('StartPlaying', () => {
  console.log('Speaker started playing audio')
})
Speaker.on('StopPlaying', () => {
  console.log('Speaker stopped playing audio')
})
```

## Browser Support

Requires browsers with support for:

- Web Audio API
- MediaSource Extensions (MSE)
- `HTMLMediaElement.setSinkId()` for device selection
- `HTMLMediaElement.captureStream()` for audio analysis
- AudioContext and related APIs

## Notes

- Device selection is persisted in localStorage under `micdrop.speakerDevice`
- Uses MediaSource Extensions for efficient streaming playback
- Supports queueing of audio blobs for continuous playback
- Automatically handles audio context initialization and unlocking
- Implements automatic recovery from invalid states
- Audio analysis is available through the `analyser` instance
- Error handling is implemented with detailed console logging for debugging
