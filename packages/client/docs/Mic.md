# Mic

The Mic module provides functionality for managing microphone input and audio recording in the browser.

## Features

- 🎤 Microphone input device management
- 🔊 Audio stream handling
- 📊 Real-time audio analysis
- 💾 Persistent device selection

## Usage Example

```typescript
import { Mic } from '@micdrop/client'

// Start microphone with default device
const stream = await Mic.start()

// Start microphone with specific device
const deviceStream = await Mic.start('device-id')

// Stop microphone and cleanup when done
Mic.stop()

// Monitor volume changes using the audio analyser
// Volume is in dB range -100 to 0
Mic.analyser.on('volume', (volume: number) => {
  // Convert to 0-100 range for visualization if needed
  const normalizedVolume = Math.max(0, volume + 100)
  console.log('Current volume:', normalizedVolume)
})
```

## API Reference

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

#### `stop(): void`

Stops the microphone stream and cleans up resources.

```typescript
Mic.stop()
```

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

## Browser Support

Fully supported in Chrome, Firefox, Safari and Edge.

Requires support for:

- Web Audio API
- MediaDevices API
