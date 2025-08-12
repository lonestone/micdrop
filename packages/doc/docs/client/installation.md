# Installation

Install the Micdrop client package for browser-based voice conversations.

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
  url: 'ws://your-server.com/ws'
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
  
  return (
    <div>
      {state.isListening && <p>🎤 Listening...</p>}
      {state.isProcessing && <p>🤔 Processing...</p>}
      {state.isAssistantSpeaking && <p>🔊 Assistant speaking...</p>}
    </div>
  )
}
```

### Vue.js

```vue
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
        url: 'ws://your-server.com/ws'
      })
    },
    async stopCall() {
      await Micdrop.stop()
    }
  }
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
  `
})
export class VoiceChatComponent {
  async startCall() {
    await Micdrop.start({
      url: 'ws://your-server.com/ws'
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
    url: 'ws://your-server.com/ws'
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