# Pause/Resume Call

Control the conversation flow by pausing and resuming the microphone and audio processing.

## Pause Call

Temporarily pause the conversation to stop listening and speaking:

```typescript
import { Micdrop } from '@micdrop/client'

// Pause the call - stops microphone and mutes speaker
Micdrop.pause()

console.log('Call paused:', Micdrop.isPaused) // true
```

When paused:

- ⏸️ Microphone stops recording
- ⏸️ Voice activity detection is disabled
- ⏸️ No audio is sent to the server
- ⏸️ Incoming audio is muted
- ✅ WebSocket connection remains active

## Resume Call

Resume the conversation to continue listening and speaking:

```typescript
// Resume the call - restarts microphone and unmutes speaker
Micdrop.resume()

console.log('Call paused:', Micdrop.isPaused) // false
console.log('Now listening:', Micdrop.isListening) // true
```

When resumed:

- ✅ Microphone starts recording again
- ✅ Voice activity detection is re-enabled
- ✅ Audio processing continues
- ✅ Incoming audio plays normally

## State Monitoring

Monitor pause/resume state changes:

```typescript
Micdrop.on('StateChange', (state) => {
  if (state.isPaused) {
    console.log('🔇 Call is paused')
    // Update UI to show paused state
    updateStatus('Paused - Click to resume')
  } else if (state.isListening) {
    console.log('🎤 Call resumed - Listening...')
    // Update UI to show active state
    updateStatus('Listening for your voice')
  }
})
```

## UI Integration

Create pause/resume controls in your interface:

```typescript
// Button handler for pause/resume toggle
function togglePause() {
  if (Micdrop.isPaused) {
    Micdrop.resume()
    document.getElementById('pauseBtn').textContent = 'Pause'
  } else {
    Micdrop.pause()
    document.getElementById('pauseBtn').textContent = 'Resume'
  }
}
```

```typescript
import { useMicdropState } from '@micdrop/react'

// React component example
function CallControls() {
  const state = useMicdropState()

  return (
    <button onClick={state.isPaused ? Micdrop.resume : Micdrop.pause}>
      {state.isPaused ? '▶️ Resume' : '⏸️ Pause'}
    </button>
  )
}
```
