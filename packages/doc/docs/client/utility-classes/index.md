# Utility Classes

Direct access to the underlying Micdrop utility classes for advanced use cases and custom implementations.

## Overview

While the `Micdrop` singleton provides the main interface, you can also use the individual utility classes directly for more granular control:

- **[Mic](./mic)** - Direct microphone input management
- **[MicdropClient](./micdrop-client)** - Core client class for WebSocket and conversation management
- **[MicRecorder](./mic-recorder)** - Audio recording with voice activity detection
- **[Speaker](./speaker)** - Audio output and device management

## When to Use Utility Classes

### Use the Micdrop Singleton When:

- ✅ Building standard voice conversations
- ✅ Using React hooks
- ✅ Want simple, high-level API
- ✅ Following quick start guides

### Use Utility Classes When:

- 🔧 Building custom voice applications
- 🔧 Need multiple simultaneous instances
- 🔧 Implementing custom audio processing
- 🔧 Creating specialized integrations

## Quick Examples

### Direct Microphone Access

```typescript
import { Mic } from '@micdrop/client'

// Start microphone independently
const stream = await Mic.start()

// Monitor volume directly
Mic.analyser.on('volume', (volume) => {
  console.log('Mic volume:', volume)
})
```

### Custom MicdropClient Instance

```typescript
import { MicdropClient } from '@micdrop/client'

// Create custom client instance
const client = new MicdropClient({
  url: 'ws://localhost:8081',
  debugLog: true,
})

await client.start()
```

### Direct Speaker Control

```typescript
import { Speaker } from '@micdrop/client'

// Change speaker device
await Speaker.changeDevice('device-id')

// Play audio blob directly
await Speaker.playAudio(audioBlob)
```

## Architecture

```
Micdrop (Singleton)
├── MicdropClient
│   ├── MicRecorder
│   │   └── VAD (Volume/Silero/Custom)
│   └── Speaker
├── Mic (Utility)
└── Speaker (Utility)
```

The singleton provides convenience methods that delegate to these utility classes, while the classes can be used independently for advanced scenarios.
