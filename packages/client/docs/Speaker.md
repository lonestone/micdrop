# Speaker

The Speaker module provides functionality for managing audio output devices and playing audio in the browser.

## Features

- 🔊 Audio output device management
- 🎵 Streaming audio playback
- 📊 Real-time audio analysis
- 💾 Persistent device selection
- 🔄 Dynamic device switching
- ⏯️ Playing state events

## Usage Example

```typescript
import { Speaker } from '@micdrop/client'

// Change to a specific output device
await Speaker.changeDevice('device-id')

// Play an audio blob (audio/webm; codecs=opus)
const audioResponse = await fetch('audio.webm')
if (audioResponse.ok) {
  const audioBlob = await audioResponse.blob()
  await Speaker.playAudio(audioBlob)
}

// Pause playback
Speaker.pauseAudio()

// Resume playback
Speaker.resumeAudio()

// Stop playback and cleanup
Speaker.stopAudio()

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

#### `changeDevice(deviceId: string): Promise<void>`

Changes the current audio output device.

```typescript
await Speaker.changeDevice(deviceId)
```

#### `playAudio(blob: Blob): Promise<void>`

Plays an audio blob.

```typescript
await Speaker.playAudio(audioBlob)
```

- Audio must be in `audio/webm; codecs=opus` format.
- An audio can be split into chunks and provided sequentially to `playAudio` as long as the first chunk has headers.

#### `pauseAudio(): void`

Pauses the currently playing audio.

```typescript
Speaker.pauseAudio()
```

#### `resumeAudio(): void`

Resumes paused audio playback.

```typescript
Speaker.resumeAudio()
```

#### `stopAudio(): void`

Stops audio playback and cleans up resources.

```typescript
Speaker.stopAudio()
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

Fully supported in Chrome, Firefox, Safari and Edge.

Requires support for:

- Web Audio API
- MediaSource Extensions (MSE)
- `HTMLMediaElement.setSinkId()` or `AudioContext.setSinkId()` for device selection
