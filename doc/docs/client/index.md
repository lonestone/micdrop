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
