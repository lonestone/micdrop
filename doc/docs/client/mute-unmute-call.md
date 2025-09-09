# Mute/Unmute Call

Control microphone input during a conversation by muting and unmuting the microphone while keeping the call active.

## Mute Call

Temporarily mute the microphone to stop sending audio while keeping the conversation active:

```typescript
import { Micdrop } from '@micdrop/client'

// Mute the microphone - stops recording but keeps call active
Micdrop.mute()

console.log('Call muted:', Micdrop.isMuted) // true
```

When muted:

- ⏸️ Microphone stops recording
- ⏸️ No audio is sent to the server
- ✅ Voice activity detection stays enabled
- ✅ WebSocket connection remains active
- ✅ Assistant audio continues to play
- ✅ Call processing continues normally

## Unmute Call

Unmute the microphone to resume sending audio:

```typescript
// Unmute the microphone - restarts recording
Micdrop.unmute()

console.log('Call muted:', Micdrop.isMuted) // false
console.log('Now listening:', Micdrop.isListening) // true
```

When unmuted:

- ✅ Microphone starts recording again

## State Monitoring

Monitor mute/unmute state changes:

```typescript
Micdrop.on('StateChange', (state) => {
  if (state.isMuted) {
    console.log('🔇 Microphone is muted')
    // Update UI to show muted state
    updateStatus('Muted - Click to unmute')
  } else if (state.isListening) {
    console.log('🎤 Microphone unmuted - Listening...')
    // Update UI to show active state
    updateStatus('Listening for your voice')
  }
})
```

## UI Integration

Create mute/unmute controls in your interface:

```typescript
// Button handler for mute/unmute toggle
function toggleMute() {
  if (Micdrop.isMuted) {
    Micdrop.unmute()
    document.getElementById('muteBtn').textContent = 'Mute'
  } else {
    Micdrop.mute()
    document.getElementById('muteBtn').textContent = 'Unmute'
  }
}
```

React example:

```tsx
import { useMicdropState } from '@micdrop/react'

function CallControls() {
  const state = useMicdropState()

  return (
    <button onClick={state.isMuted ? Micdrop.unmute : Micdrop.mute}>
      {state.isMuted ? '🔊 Unmute' : '🔇 Mute'}
    </button>
  )
}
```

## Difference from Pause

Unlike pausing, muting only affects the microphone input:

| Feature         | Mute         | Pause       |
| --------------- | ------------ | ----------- |
| Microphone      | ❌ Disabled  | ❌ Disabled |
| Assistant Audio | ✅ Continues | ❌ Stopped  |
| Processing      | ✅ Active    | ❌ Paused   |
| Connection      | ✅ Active    | ✅ Active   |

Use **mute** when you want to temporarily stop speaking but continue listening to the assistant. Use **pause** when you want to completely halt the conversation.
