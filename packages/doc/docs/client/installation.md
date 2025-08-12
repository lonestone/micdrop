# Installation

Install Micdrop client package for browser-based voice conversations.

## Package Installation

```bash
npm install @micdrop/client
```

That's it! No additional configuration or dependencies needed.

## Framework Integration

### Vanilla JavaScript/TypeScript

```typescript
import { Micdrop } from '@micdrop/client'

await Micdrop.start({
  url: 'ws://localhost:8081/',
})
```

### React

For React applications, also install the React hooks package:

```bash
npm install @micdrop/react
```

```tsx
import { Micdrop } from '@micdrop/client'
import { useMicdropState } from '@micdrop/react'

function VoiceChat() {
  const state = useMicdropState()
  const handleStart = () => Micdrop.start({ url: 'ws://localhost:8081/' })
  const handleStop = () => Micdrop.stop()

  return (
    <div>
      <button onClick={handleStart}>Start</button>
      <button onClick={handleStop}>Stop</button>
      {state.isListening && <p>🎤 Listening...</p>}
      {state.isProcessing && <p>🤔 Processing...</p>}
      {state.isAssistantSpeaking && <p>🔊 Assistant speaking...</p>}
    </div>
  )
}
```

Learn more about [Micdrop React hooks](./react-hooks).

### Vue.js

```html
<template>
  <div>
    <button @click="startCall">Start Call</button>
    <button @click="stopCall">Stop Call</button>
  </div>
</template>

<script>
  import { Micdrop } from '@micdrop/client'

  export default {
    methods: {
      async startCall() {
        await Micdrop.start({
          url: 'ws://localhost:8081/',
        })
      },
      async stopCall() {
        await Micdrop.stop()
      },
    },
  }
</script>
```

### Angular

```typescript
import { Component } from '@angular/core'
import { Micdrop } from '@micdrop/client'

@Component({
  selector: 'app-voice-chat',
  template: `
    <button (click)="startCall()">Start Call</button>
    <button (click)="stopCall()">Stop Call</button>
  `,
})
export class VoiceChatComponent {
  async startCall() {
    await Micdrop.start({
      url: 'ws://localhost:8081/',
    })
  }

  async stopCall() {
    await Micdrop.stop()
  }
}
```

## CDN Usage

For quick prototyping or simple HTML pages:

```html
<script type="module">
  import { Micdrop } from 'https://unpkg.com/@micdrop/client@latest/dist/index.js'

  await Micdrop.start({
    url: 'ws://localhost:8081/',
  })
</script>
```

## Browser Requirements

Ensure your target browsers support:

- **WebSocket API** - For real-time communication
- **Web Audio API** - For audio processing and playback
- **MediaDevices API** - For microphone access
- **MediaRecorder API** - For audio recording

All modern browsers support these APIs. For legacy browser support, consider polyfills.
