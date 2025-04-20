# Speaker

The Speaker module provides functionality for managing audio output devices and playing audio in the browser.

## Features

- 🔊 Audio output device management
- 🎵 Streaming audio playback
- 📊 Real-time audio analysis
- 💾 Persistent device selection
- 🔄 Dynamic device switching
- ⏯️ Pause and resume capabilities
- 🔄 Automatic stream recovery

## API Reference

### Functions

#### `canChangeSpeakerDevice()`

Checks if the browser supports changing audio output devices.

```typescript
function canChangeSpeakerDevice(): boolean
```

Returns `true` if the browser supports changing audio output devices, `false` otherwise.

#### `changeSpeakerDevice(speakerId: string)`

Changes the current audio output device.

```typescript
async function changeSpeakerDevice(speakerId: string): Promise<void>
```

- `speakerId`: The ID of the audio output device to use
- Saves the selected device ID to local storage
- Automatically initializes audio pipeline if needed

#### `playAudio(blob: Blob)`

Plays an audio blob through the current audio output device using MediaSource Extensions.

```typescript
async function playAudio(blob: Blob): Promise<void>
```

- `blob`: The audio blob to play
- Queues blobs for continuous playback
- Automatically handles audio pipeline initialization
- Connects to audio analyser for visualization (see `speakerAnalyser`)
- Supports streaming playback with automatic buffer management

#### `pauseAudio()`

Pauses the currently playing audio.

```typescript
function pauseAudio(): void
```

- Pauses playback while maintaining the audio pipeline
- Can be resumed using `resumeAudio()`

#### `resumeAudio()`

Resumes paused audio playback.

```typescript
function resumeAudio(): void
```

- Resumes playback from where it was paused

#### `stopAudio()`

Stops audio playback and cleans up resources.

```typescript
function stopAudio(): void
```

- Stops playback completely
- Cleans up all audio resources including MediaSource and buffers
- Disconnects from audio analyser
- Stops and cleans up any active media streams

### Variables

#### `speakerAnalyser`

An instance of `AudioAnalyser` that can be used to analyze the audio output.

```typescript
const speakerAnalyser: AudioAnalyser
```

## Example Usage

```typescript
import { Speaker } from '@micdrop/client'

// Check if device selection is supported
if (Speaker.canChangeSpeakerDevice()) {
  // Change to a specific output device
  await Speaker.changeSpeakerDevice('device-id')
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

// Resume playback
Speaker.resumeAudio()

// Stop playback and cleanup
Speaker.stopAudio()

// Access the audio analyser for visualization
if (Speaker.speakerAnalyser) {
  const analyserData = Speaker.speakerAnalyser.getByteFrequencyData()
  // Use the data for visualization
}
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
- Audio analysis is available through the `speakerAnalyser` instance
- Error handling is implemented with detailed console logging for debugging
