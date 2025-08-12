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
- ❌ Microphone stops recording
- ❌ Voice activity detection is disabled  
- ❌ No audio is sent to the server
- ❌ Incoming audio is muted
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

## Auto-pause Scenarios

The call may automatically pause in certain situations:

```typescript
Micdrop.on('StateChange', (state) => {
  if (state.isPaused) {
    // Check if this was a user action or automatic pause
    if (state.error) {
      console.log('Auto-paused due to error:', state.error.message)
      
      // Handle specific errors
      switch (state.error.code) {
        case 'MIC_PERMISSION_DENIED':
          showMicPermissionDialog()
          break
        case 'CONNECTION_LOST':
          showReconnectDialog()
          break
      }
    }
  }
})
```

## Pause During Assistant Speech

By default, pausing stops all audio processing including assistant speech:

```typescript
// Pause will stop current assistant speech
Micdrop.pause()

// To allow assistant to finish speaking before pausing
if (!Micdrop.isAssistantSpeaking) {
  Micdrop.pause()
} else {
  // Wait for assistant to finish, then pause
  Micdrop.on('StateChange', (state) => {
    if (!state.isAssistantSpeaking) {
      Micdrop.pause()
    }
  })
}
```

## Best Practices

### Temporary Interruptions
```typescript
// Handle tab focus/blur for automatic pause/resume
document.addEventListener('visibilitychange', () => {
  if (document.hidden && Micdrop.isStarted) {
    Micdrop.pause()
  } else if (!document.hidden && Micdrop.isPaused) {
    Micdrop.resume()
  }
})
```

### User Interface Feedback
```typescript
function updateCallStatus() {
  const state = Micdrop.state
  
  if (state.isPaused) {
    statusElement.textContent = '⏸️ Paused'
    statusElement.className = 'status-paused'
  } else if (state.isListening) {
    statusElement.textContent = '🎤 Listening'
    statusElement.className = 'status-listening'
  } else if (state.isProcessing) {
    statusElement.textContent = '🤔 Processing'
    statusElement.className = 'status-processing'
  }
}
```

### Graceful Pause/Resume
```typescript
async function gracefulPause() {
  // Wait for current processing to finish
  if (Micdrop.isProcessing) {
    await new Promise(resolve => {
      const checkState = () => {
        if (!Micdrop.isProcessing) {
          resolve()
        } else {
          setTimeout(checkState, 100)
        }
      }
      checkState()
    })
  }
  
  Micdrop.pause()
}
```

## Next Steps

- [**Stop Call**](./stop-call) - End the conversation completely
- [**Error Handling**](./error-handling) - Handle pause-related errors
- [**State Management**](./utility-classes/micdrop-client) - Understanding all state properties