# Client (Browser)

Micdrop client handles real-time voice conversations in the browser with microphone input, speaker output, voice activity detection, and WebSocket communication.

## Installation

```bash
npm install @micdrop/client
```

That's it 🎉 The client is ready to use in any browser, with any framework.

See [Installation](./installation) for more details.

## Quick Example

```typescript
import { Micdrop } from '@micdrop/client'

// Start a voice conversation
await Micdrop.start({
  url: 'ws://localhost:8081',
})
```

## Features

- 🎤 **Microphone Management** - Device selection, permissions, and audio streaming
- 🔊 **Audio Playback** - High-quality streaming audio with device control
- 🧠 **Voice Activity Detection** - Multiple VAD algorithms including AI-based detection
- 🌐 **WebSocket Communication** - Low-latency bidirectional audio streaming
- 📱 **Device Management** - Select and test microphone and speaker devices
- ⚡ **Real-time State** - Complete conversation state with events
- 🛡️ **Error Handling** - Comprehensive error management with specific codes

## Browser Support

Fully tested on desktop and mobile:

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge

Target browsers must support the following APIs:

- **WebSocket API** - For real-time communication
- **Web Audio API** - For audio processing and playback
- **MediaDevices API** - For microphone access
- **MediaRecorder API** - For audio recording
