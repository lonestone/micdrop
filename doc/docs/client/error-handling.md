# Error Handling

Handle errors gracefully in your voice conversations with comprehensive error management and user feedback.

## Basic Error Handling

Listen for errors using the Error event:

```typescript
import { Micdrop } from '@micdrop/client'

// Listen for all errors
Micdrop.on('Error', (error) => {
  console.error('Error:', error.code, error.message)
})
```

## State-Based Error Handling

Access error information from the state:

```typescript
// Check for errors in state
Micdrop.on('StateChange', (state) => {
  if (state.error) {
    console.error('Error:', state.error.code, state.error.message)
    updateErrorDisplay(state.error)
  } else {
    clearErrorDisplay()
  }
})
```

With React hook:

```tsx
// React component example
function ErrorDisplay() {
  const state = useMicdropState()

  if (!state.error) return null

  return (
    <div className="error-banner">
      <span className="error-icon">⚠️</span>
      <span className="error-message">
        {getUserFriendlyMessage(state.error)}
      </span>
      <button
        className="error-action"
        onClick={() => handleErrorAction(state.error)}
      >
        {getErrorActionLabel(state.error.code)}
      </button>
    </div>
  )
}
```

## Error Types

Micdrop provides specific error codes to help you handle different scenarios:

### Connection Errors

```typescript
Micdrop.on('Error', (error) => {
  switch (error.code) {
    case 'MissingUrl':
      showError('Please provide a server URL to connect to')
      break

    case 'Connection':
      showError(
        'Failed to connect to server. Please check your internet connection.'
      )
      break

    case 'BadRequest':
      showError('Invalid request parameters. Please check your configuration.')
      break

    case 'NotFound':
      showError('Voice server not found. Please check the server URL.')
      break

    case 'Unauthorized':
      showError('Authentication failed. Please check your credentials.')
      showLoginDialog()
      break

    case 'InternalServer':
      showError('Server error occurred. Please try again later.')
      break
  }
})
```

### Microphone Error

```typescript
Micdrop.on('Error', (error) => {
  if (error.code === 'Mic') {
    console.error('Microphone error:', error.message)
    showMicPermissionDialog()
  }
})
```
