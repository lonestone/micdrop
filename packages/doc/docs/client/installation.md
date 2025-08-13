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
