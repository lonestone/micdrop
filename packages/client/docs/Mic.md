# Mic

The Mic module provides functionality for managing microphone input and audio recording in the browser.

## Features

- 🎤 Microphone input device management
- 🔊 Audio stream handling
- 📊 Real-time audio analysis
- 💾 Persistent device selection
- ⏱️ Delayed audio stream creation

## API Reference

To import Mic instance:

```typescript
import { Mic } from '@micdrop/client'
```

### Functions

#### `start(deviceId?: string): Promise<MediaStream>`

Starts the microphone and returns the audio stream.

```typescript
const stream = await Mic.start()
```

or

```typescript
const stream = await Mic.start(deviceId)
```

- `deviceId`: Optional ID of the microphone device to use
- Stores selected device ID in localStorage
- Returns a promise that resolves with the microphone's MediaStream

#### `stop(): void`

Stops the microphone stream and cleans up resources.

```typescript
Mic.stop()
```

- Disconnects the audio source
- Stops the media stream
- Cleans up internal references

### Variables

#### `analyser`

An instance of `AudioAnalyser` that can be used to analyze the microphone input.

```typescript
Mic.analyser.on('volume', (volume: number) => {
  console.log('Current volume:', volume)
})

// AnalyserNode
// See https://developer.mozilla.org/docs/Web/API/AnalyserNode
console.log(Mic.analyser.node)
```

#### `defaultThreshold`

Default threshold for microphone sensitivity in decibels (dB).

```typescript
console.log(Mic.defaultThreshold)
```

## Example Usage

```typescript
import { Mic } from '@micdrop/client'

// Start microphone with default device
const stream = await Mic.start()

// Start microphone with specific device
const deviceStream = await Mic.start()

// Monitor volume changes using the audio analyser
// Volume is in dB range -100 to 0
Mic.analyser.on('volume', (volume: number) => {
  // Convert to 0-100 range for visualization if needed
  const normalizedVolume = Math.max(0, volume + 100)
  console.log('Current volume:', normalizedVolume)
})

// Stop microphone and cleanup when done
Mic.stop()
```

## Browser Support

Requires browsers with support for:

- Web Audio API
- MediaDevices API
- getUserMedia API
- AudioContext and related APIs

## Notes

- Device selection is persisted in localStorage
- Audio analysis is available through the `analyser` instance
- The module automatically handles AudioContext initialization and unlocking
- Default configuration includes echo cancellation and noise suppression
- Sample rate is set to 16kHz for optimal voice recording
