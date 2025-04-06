# Mic

The Mic module provides functionality for managing microphone input and audio recording in the browser.

## Features

- 🎤 Microphone input device management
- 🔊 Audio stream handling
- 📊 Real-time audio analysis
- 💾 Persistent device selection
- ⏱️ Delayed audio stream creation

## API Reference

### Functions

#### `startMicrophone(deviceId?: string)`

Starts the microphone and returns the audio stream.

```typescript
async function startMicrophone(deviceId?: string): Promise<MediaStream>
```

- `deviceId`: Optional ID of the microphone device to use
- Initializes AudioContext if needed
- Stores selected device ID in localStorage
- Returns a promise that resolves with the microphone's MediaStream

#### `stopMicrophone()`

Stops the microphone stream and cleans up resources.

```typescript
function stopMicrophone(): void
```

- Disconnects the audio source
- Stops the media stream
- Cleans up internal references

### Variables

#### `micAnalyser`

An instance of `AudioAnalyser` that can be used to analyze the microphone input.

```typescript
let micAnalyser: AudioAnalyser | undefined
```

#### `defaultMicThreshold`

Default threshold for microphone sensitivity.

```typescript
const defaultMicThreshold: number = -50
```

## Example Usage

```typescript
import { Mic } from '@micdrop/client'

// Start microphone with default device
const stream = await Mic.startMicrophone()

// Start microphone with specific device
const deviceStream = await Mic.startMicrophone('device-id-123')

// Monitor volume changes using the audio analyser
if (Mic.micAnalyser) {
  // Volume is in dB range -100 to 0
  Mic.micAnalyser.on('volume', (volume: number) => {
    // Convert to 0-100 range for visualization if needed
    const normalizedVolume = Math.max(0, volume + 100)
    console.log('Current volume:', normalizedVolume)
  })
}

// Stop microphone and cleanup when done
Mic.stopMicrophone()
```

## Browser Support

Requires browsers with support for:

- Web Audio API
- MediaDevices API
- getUserMedia API
- AudioContext and related APIs

## Notes

- Device selection is persisted in localStorage
- Audio analysis is available through the `micAnalyser` instance
- The module automatically handles AudioContext initialization and unlocking
- Default configuration includes echo cancellation and noise suppression
- Sample rate is set to 16kHz for optimal voice recording
