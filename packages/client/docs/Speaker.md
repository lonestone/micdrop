# Speaker

The Speaker module provides functionality for managing audio output devices and playing audio in the browser.

## Features

- 🔊 Audio output device management
- 🎵 Audio blob playback
- 📊 Audio analysis capabilities
- 💾 Persistent device selection
- 🔄 Dynamic device switching

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
- Throws an error if setting the device fails

#### `playAudioBlob(blob: Blob)`

Plays an audio blob through the current audio output device.

```typescript
async function playAudioBlob(blob: Blob): Promise<void>
```

- `blob`: The audio blob to play
- Creates an AudioBufferSourceNode to play the audio
- Connects to the audio analyser for visualization
- Automatically cleans up resources when playback ends

#### `stopAudioBlob()`

Stops the currently playing audio blob.

```typescript
function stopAudioBlob(): void
```

- Stops playback of the current audio blob if one is playing
- Disconnects and cleans up the audio source node

### Variables

#### `speakerAnalyser`

An instance of `AudioAnalyser` that can be used to analyze the audio output.

```typescript
let speakerAnalyser: AudioAnalyser | undefined
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
  { type: 'audio/wav' }
)
await Speaker.playAudioBlob(audioBlob)

// Stop playback
Speaker.stopAudioBlob()

// Access the audio analyser for visualization
if (Speaker.speakerAnalyser) {
  const analyserData = Speaker.speakerAnalyser.getByteFrequencyData()
  // Use the data for visualization
}
```

## Browser Support

Requires browsers with support for:

- Web Audio API
- `HTMLMediaElement.setSinkId()` for device selection
- AudioContext and related APIs

## Notes

- Device selection is persisted in localStorage
- Audio analysis is available through the `speakerAnalyser` instance
- The module automatically handles audio context initialization and unlocking
- Error handling is implemented with console logging for debugging
