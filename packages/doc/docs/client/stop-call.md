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

- 🛑 Microphone recording ends
- 🛑 WebSocket connection closes
- 🛑 Audio processing stops
- 🛑 All event listeners are cleaned up
- 🛑 VAD algorithms are stopped

## Graceful Stop

Wait for current operations to complete before stopping:

```typescript
async function gracefulStop() {
  if (!Micdrop.isAssistantSpeaking) {
    Micdrop.stop()
    console.log('Call stopped immediately')
  } else {
    // Wait for assistant to finish, then stop
    const handler = (state: MicdropState) => {
      if (!state.isAssistantSpeaking) {
        Micdrop.stop()
        Micdrop.off('StateChange', handler)
        console.log('Call stopped gracefully')
      }
    }
    Micdrop.on('StateChange', handler)
  }
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

## Auto-stop on EndCall event

You may want the assistant to be able to end the call, for example when the user says "Bye bye".

The [agent](../ai-integration/custom-integrations/custom-agent.md) can send an `EndCall` that can be listened to by the client.

```typescript
Micdrop.on('EndCall', () => {
  console.log('🔚 Call ended by assistant')
  Micdrop.stop()
})
```

You can gracefully stop the call by waiting for the assistant to finish speaking (see above).
