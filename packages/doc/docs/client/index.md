# Client (Browser)

Micdrop client handles real-time voice conversations in the browser with microphone input, speaker output, voice activity detection, and WebSocket communication.

## Installation

```bash
npm install @micdrop/client
```

That's it 🎉 The client is ready to use in any browser, with any framework.

## Quick Example

```typescript
import { Micdrop } from '@micdrop/client'

// Start a voice conversation
await Micdrop.start({
  url: 'ws://localhost:8081',
  vad: ['volume', 'silero'],
})

// Listen for state changes
Micdrop.on('StateChange', (state) => {
  console.log('Listening:', state.isListening)
  console.log('Processing:', state.isProcessing)
  console.log('Assistant speaking:', state.isAssistantSpeaking)
})

// Stop the conversation
await Micdrop.stop()
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

- ✅ Chrome/Chromium 60+
- ✅ Firefox 60+
- ✅ Safari 12+
- ✅ Edge 80+

Requires: WebSocket API, Web Audio API, MediaDevices API, MediaRecorder API
