# Stop Call

End the voice conversation by stopping the microphone, closing the WebSocket connection, and cleaning up resources.

## Basic Stop

Stop the current call and clean up all resources:

```typescript
import { Micdrop } from '@micdrop/client'

// Stop the call
await Micdrop.stop()

console.log('Call stopped:', !Micdrop.isStarted) // true
```

When stopped:
- ❌ Microphone recording ends
- ❌ WebSocket connection closes
- ❌ Audio processing stops
- ❌ All event listeners are cleaned up
- ❌ VAD algorithms are stopped

## Graceful Stop

Wait for current operations to complete before stopping:

```typescript
async function gracefulStop() {
  // If assistant is currently speaking, let them finish
  if (Micdrop.isAssistantSpeaking) {
    console.log('Waiting for assistant to finish speaking...')
    
    await new Promise(resolve => {
      const checkState = () => {
        if (!Micdrop.isAssistantSpeaking) {
          resolve()
        } else {
          setTimeout(checkState, 100)
        }
      }
      checkState()
    })
  }
  
  await Micdrop.stop()
  console.log('Call stopped gracefully')
}
```

## State Monitoring

Monitor the stop process:

```typescript
Micdrop.on('StateChange', (state) => {
  if (!state.isStarted && !state.isStarting) {
    console.log('✅ Call fully stopped')
    // Update UI to show stopped state
    updateCallButton('Start Call', 'green')
  }
})

await Micdrop.stop()
```

## Error Handling

Handle potential errors during stop:

```typescript
try {
  await Micdrop.stop()
  console.log('Call stopped successfully')
} catch (error) {
  console.error('Error stopping call:', error.message)
  
  // Even if there's an error, the call should be considered stopped
  console.log('Call state:', Micdrop.isStarted) // should be false
}
```

## Auto-stop Scenarios

The call may automatically stop in certain situations:

```typescript
Micdrop.on('EndCall', () => {
  console.log('🔚 Call ended by assistant')
  // The call is automatically stopped
  // Update UI accordingly
  showCallEndedMessage()
})

Micdrop.on('Error', (error) => {
  console.error('Call error:', error.message)
  
  // Some errors automatically stop the call
  if (error.code === 'CONNECTION_LOST' || error.code === 'UNAUTHORIZED') {
    console.log('Call automatically stopped due to error')
    showErrorDialog(error.message)
  }
})
```

## UI Integration

Create stop controls in your interface:

```typescript
// Button handler for stop
async function handleStop() {
  const stopButton = document.getElementById('stopBtn')
  stopButton.disabled = true
  stopButton.textContent = 'Stopping...'
  
  try {
    await Micdrop.stop()
    
    // Reset UI
    document.getElementById('startBtn').disabled = false
    stopButton.disabled = true
    stopButton.textContent = 'Stop Call'
    
  } catch (error) {
    console.error('Stop failed:', error)
    stopButton.disabled = false
    stopButton.textContent = 'Stop Call'
  }
}

// React component example
function CallControls() {
  const state = useMicdropState()
  const [stopping, setStopping] = useState(false)
  
  const handleStop = async () => {
    setStopping(true)
    try {
      await Micdrop.stop()
    } finally {
      setStopping(false)
    }
  }
  
  return (
    <button 
      onClick={handleStop} 
      disabled={!state.isStarted || stopping}
    >
      {stopping ? 'Stopping...' : '🛑 Stop Call'}
    </button>
  )
}
```

## Cleanup After Stop

Perform additional cleanup after stopping:

```typescript
async function cleanupCall() {
  await Micdrop.stop()
  
  // Clear conversation history from UI
  clearConversationDisplay()
  
  // Reset any local state
  resetCallTimer()
  clearNotifications()
  
  // Log session end
  logSessionEnd({
    duration: getCallDuration(),
    messagesExchanged: getMessageCount()
  })
}
```

## Prevent Accidental Stop

Add confirmation for important calls:

```typescript
async function stopWithConfirmation() {
  if (Micdrop.isStarted) {
    const confirmed = confirm('Are you sure you want to end the call?')
    if (!confirmed) return
  }
  
  await Micdrop.stop()
}

// Or with a custom modal
async function stopWithModal() {
  const shouldStop = await showConfirmationModal({
    title: 'End Call?',
    message: 'Are you sure you want to end the voice conversation?',
    confirmText: 'End Call',
    cancelText: 'Continue'
  })
  
  if (shouldStop) {
    await Micdrop.stop()
  }
}
```

## Resource Cleanup

The stop method automatically handles:

- 🎤 **Microphone stream** - Stops all tracks and releases permissions
- 🌐 **WebSocket connection** - Closes connection and removes listeners  
- 🧠 **VAD algorithms** - Stops processing and frees memory
- 🔊 **Audio context** - Suspends context and disconnects nodes
- 📊 **Audio analyzers** - Stops analysis and removes event listeners
- 💾 **Event listeners** - Removes all registered event handlers

## Restart After Stop

You can restart the call after stopping:

```typescript
// Stop the current call
await Micdrop.stop()

// Wait a moment (optional)
await new Promise(resolve => setTimeout(resolve, 1000))

// Start a new call
await Micdrop.start({
  url: 'ws://localhost:8080'
})
```

## Next Steps

- [**Error Handling**](./error-handling) - Handle stop-related errors
- [**Start Call**](./start-call) - Begin a new conversation
- [**State Management**](./utility-classes/micdrop-client) - Understanding call lifecycle