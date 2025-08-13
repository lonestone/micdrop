# Call State

Monitor and react to real-time conversation state changes during voice calls.

## State Overview

The Micdrop client provides detailed state information about the conversation flow:

```typescript
import { Micdrop } from '@micdrop/client'

// Listen for all state changes
Micdrop.on('StateChange', (state) => {
  console.log('Current state:', state)
})
```

## State Properties

The `MicdropState` object contains these properties:

| Property              | Type                  | Description                          |
| --------------------- | --------------------- | ------------------------------------ |
| `isStarting`          | `boolean`             | Call is connecting and starting      |
| `isStarted`           | `boolean`             | Call is active and ready             |
| `isPaused`            | `boolean`             | Call is paused (no audio processing) |
| `isListening`         | `boolean`             | Ready to detect user speech          |
| `isProcessing`        | `boolean`             | Processing user input on server      |
| `isUserSpeaking`      | `boolean`             | User voice detected                  |
| `isAssistantSpeaking` | `boolean`             | Assistant audio playing              |
| `isMicStarted`        | `boolean`             | Microphone is active                 |
| `isMicMuted`          | `boolean`             | Microphone is muted                  |
| `micDeviceId`         | `string`              | Active microphone device ID          |
| `speakerDeviceId`     | `string`              | Active speaker device ID             |
| `micDevices`          | `MediaDeviceInfo[]`   | Available microphones                |
| `speakerDevices`      | `MediaDeviceInfo[]`   | Available speakers                   |
| `conversation`        | `MicdropConversation` | Message history                      |
| `error`               | `MicdropClientError`  | Current error if any                 |

## Call Flow States

### Starting a Call

```typescript
Micdrop.on('StateChange', (state) => {
  if (state.isStarting) {
    console.log('🔄 Connecting...')
    // Show loading indicator
  }

  if (state.isStarted) {
    console.log('✅ Connected and ready!')
    // Hide loading, show active call UI
  }
})

await Micdrop.start({ url: 'ws://localhost:8081' })
```

### Conversation Flow

The typical conversation flow follows this pattern:

```typescript
Micdrop.on('StateChange', (state) => {
  // 1. Listening for user input
  if (state.isListening) {
    console.log('🎤 Listening...')
    // Show listening indicator
  }

  // 2. User starts speaking
  if (state.isUserSpeaking) {
    console.log('🗣️ User speaking...')
    // Show speaking indicator
  }

  // 3. Processing user input
  if (state.isProcessing) {
    console.log('⚡ Processing...')
    // Show processing indicator
  }

  // 4. Assistant responds
  if (state.isAssistantSpeaking) {
    console.log('🤖 Assistant speaking...')
    // Show assistant speaking indicator
  }
})
```

### Listening State Logic

The `isListening` state is `true` only when ALL these conditions are met:

- Microphone is started (`isMicStarted`)
- Call is not paused (`!isPaused`)
- Not currently processing (`!isProcessing`)
- Microphone is not muted (`!isMicMuted`)
- User is not speaking (`!isUserSpeaking`)
- Assistant is not speaking (`!isAssistantSpeaking`)

## Practical Examples

### UI State Management

```typescript
function CallInterface() {
  const [callState, setCallState] = useState(Micdrop.state)

  useEffect(() => {
    const handleStateChange = (state) => setCallState(state)
    Micdrop.on('StateChange', handleStateChange)
    return () => Micdrop.off('StateChange', handleStateChange)
  }, [])

  return (
    <div className="call-interface">
      {callState.isStarting && (
        <div className="status connecting">Connecting...</div>
      )}

      {callState.isListening && (
        <div className="status listening">🎤 Listening</div>
      )}

      {callState.isUserSpeaking && (
        <div className="status user-speaking">🗣️ You're speaking</div>
      )}

      {callState.isProcessing && (
        <div className="status processing">⚡ Processing</div>
      )}

      {callState.isAssistantSpeaking && (
        <div className="status assistant-speaking">🤖 Assistant speaking</div>
      )}

      {callState.isPaused && (
        <div className="status paused">⏸️ Call paused</div>
      )}
    </div>
  )
}
```

### Visual Indicators

```typescript
function CallStatusIndicator() {
  const [state, setState] = useState(Micdrop.state)

  useEffect(() => {
    Micdrop.on('StateChange', setState)
    return () => Micdrop.off('StateChange', setState)
  }, [])

  const getStatusColor = () => {
    if (state.isUserSpeaking) return 'blue'
    if (state.isAssistantSpeaking) return 'green'
    if (state.isProcessing) return 'yellow'
    if (state.isListening) return 'gray'
    return 'red'
  }

  const getStatusText = () => {
    if (state.isUserSpeaking) return 'Speaking'
    if (state.isAssistantSpeaking) return 'Assistant'
    if (state.isProcessing) return 'Processing'
    if (state.isListening) return 'Listening'
    if (state.isPaused) return 'Paused'
    return 'Inactive'
  }

  return (
    <div className={`status-indicator ${getStatusColor()}`}>
      {getStatusText()}
    </div>
  )
}
```

### State-Based Actions

```typescript
Micdrop.on('StateChange', (state) => {
  // Auto-scroll conversation when assistant speaks
  if (state.isAssistantSpeaking) {
    scrollToBottom()
  }

  // Update page title based on state
  if (state.isUserSpeaking) {
    document.title = '🗣️ Speaking - Micdrop'
  } else if (state.isAssistantSpeaking) {
    document.title = '🤖 Assistant - Micdrop'
  } else if (state.isListening) {
    document.title = '🎤 Listening - Micdrop'
  } else {
    document.title = 'Micdrop'
  }

  // Log conversation state changes
  if (state.conversation.length > previousLength) {
    console.log('New message:', state.conversation.at(-1))
    previousLength = state.conversation.length
  }
})
```

## State Debugging

Enable debug logging to see detailed state transitions:

```typescript
await Micdrop.start({
  url: 'ws://localhost:8081',
  debugLog: true, // Enable debug logs
})

// Or log state changes manually
Micdrop.on('StateChange', (state) => {
  console.table({
    isListening: state.isListening,
    isProcessing: state.isProcessing,
    isUserSpeaking: state.isUserSpeaking,
    isAssistantSpeaking: state.isAssistantSpeaking,
    isPaused: state.isPaused,
  })
})
```

## Performance Optimization

State changes fire frequently, so optimize your UI updates:

```typescript
import { debounce } from 'lodash'

// Debounce UI updates to avoid excessive re-renders
const debouncedUpdate = debounce((state) => {
  updateUI(state)
}, 50)

Micdrop.on('StateChange', debouncedUpdate)
```

## Next Steps

- [**Pause/Resume Call**](./pause-resume-call) - Control conversation flow
- [**Error Handling**](./error-handling) - Handle state-related errors
- [**React Hooks**](./react-hooks) - React-specific state management
