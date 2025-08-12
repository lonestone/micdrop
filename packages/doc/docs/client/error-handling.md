# Error Handling

Handle errors gracefully in your voice conversations with comprehensive error management and user feedback.

## Basic Error Handling

Listen for errors using the Error event:

```typescript
import { Micdrop } from '@micdrop/client'

// Listen for all errors
Micdrop.on('Error', (error) => {
  console.error('Micdrop error:', error.message)
  console.error('Error code:', error.code)

  // Handle based on error type
  handleMicdropError(error)
})
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
      retryConnection()
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

### Microphone Errors

```typescript
Micdrop.on('Error', (error) => {
  if (error.code === 'Mic') {
    console.error('Microphone error:', error.message)

    // Check specific microphone error types
    if (error.message.includes('Permission denied')) {
      showMicPermissionDialog()
    } else if (error.message.includes('Device not found')) {
      showDeviceSelectionDialog()
    } else {
      showError('Microphone error: ' + error.message)
    }
  }
})
```

## Error Recovery

### Automatic Retry

Implement automatic retry for recoverable errors:

```typescript
class ErrorRecovery {
  private retryCount = 0
  private maxRetries = 3
  private retryDelay = 1000

  async handleError(error) {
    console.error('Error occurred:', error.message)

    // Don't retry certain error types
    if (error.code === 'Unauthorized' || error.code === 'BadRequest') {
      this.showPermanentError(error)
      return
    }

    // Retry connection errors
    if (error.code === 'Connection' && this.retryCount < this.maxRetries) {
      this.retryCount++
      console.log(
        `Retrying connection (${this.retryCount}/${this.maxRetries})...`
      )

      await this.delay(this.retryDelay)

      try {
        await Micdrop.start({ url: this.serverUrl })
        this.retryCount = 0 // Reset on success
        console.log('Connection retry successful')
      } catch (retryError) {
        await this.handleError(retryError)
      }
    } else {
      this.showPermanentError(error)
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private showPermanentError(error) {
    showError(`Connection failed: ${error.message}`)
  }
}

const errorRecovery = new ErrorRecovery()
Micdrop.on('Error', (error) => errorRecovery.handleError(error))
```

### Graceful Degradation

Handle partial failures gracefully:

```typescript
async function startCallWithFallback() {
  try {
    // Try with optimal settings
    await Micdrop.start({
      url: 'ws://localhost:8081/',
      vad: ['volume', 'silero'], // Multiple VADs
      params: { quality: 'high' },
    })
  } catch (error) {
    console.warn('Optimal start failed, trying fallback...', error.message)

    try {
      // Fallback to basic settings
      await Micdrop.start({
        url: 'ws://localhost:8081/', // Try non-secure WebSocket
        vad: 'volume', // Single VAD
        params: { quality: 'standard' },
      })

      showWarning('Connected with reduced functionality')
    } catch (fallbackError) {
      showError(
        'Unable to establish voice connection: ' + fallbackError.message
      )
    }
  }
}
```

## User-Friendly Error Messages

### Error Message Mapping

Provide clear, actionable error messages:

```typescript
const ERROR_MESSAGES = {
  MissingUrl: 'Server configuration missing. Please contact support.',
  Connection:
    'Unable to connect to voice server. Please check your internet connection and try again.',
  BadRequest: 'Invalid configuration. Please refresh the page and try again.',
  NotFound: 'Voice service is currently unavailable. Please try again later.',
  Unauthorized: 'Authentication required. Please sign in to continue.',
  InternalServer:
    'Server error. Our team has been notified. Please try again in a few minutes.',
  Mic: 'Microphone access required. Please allow microphone permissions and try again.',
}

function getUserFriendlyMessage(error) {
  return ERROR_MESSAGES[error.code] || `An error occurred: ${error.message}`
}

Micdrop.on('Error', (error) => {
  const message = getUserFriendlyMessage(error)
  showErrorDialog(message, error.code)
})
```

### Error Dialog Component

```typescript
function showErrorDialog(message, errorCode) {
  const dialog = document.createElement('div')
  dialog.className = 'error-dialog'
  dialog.innerHTML = `
    <div class="error-content">
      <h3>Connection Error</h3>
      <p>${message}</p>
      <div class="error-actions">
        ${getErrorActions(errorCode)}
      </div>
    </div>
  `

  document.body.appendChild(dialog)
}

function getErrorActions(errorCode) {
  switch (errorCode) {
    case 'Mic':
      return `
        <button onclick="requestMicPermission()">Enable Microphone</button>
        <button onclick="showMicHelp()">Help</button>
      `
    case 'Unauthorized':
      return `
        <button onclick="showLogin()">Sign In</button>
        <button onclick="retryConnection()">Try Again</button>
      `
    case 'Connection':
      return `
        <button onclick="retryConnection()">Retry</button>
        <button onclick="checkConnection()">Check Connection</button>
      `
    default:
      return `
        <button onclick="retryConnection()">Try Again</button>
        <button onclick="closeErrorDialog()">OK</button>
      `
  }
}
```

## Microphone Permission Handling

### Permission Dialog

Help users enable microphone access:

```typescript
async function requestMicPermission() {
  try {
    // Request microphone access
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    })

    // Success - stop the test stream
    stream.getTracks().forEach((track) => track.stop())

    showSuccess('Microphone access granted! You can now start the call.')
    closeErrorDialog()
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      showMicPermissionHelp()
    } else {
      showError('Failed to access microphone: ' + error.message)
    }
  }
}

function showMicPermissionHelp() {
  showDialog(`
    <h3>Microphone Permission Required</h3>
    <p>To use voice chat, please:</p>
    <ol>
      <li>Click the microphone icon in your browser's address bar</li>
      <li>Select "Always allow" for this site</li>
      <li>Refresh the page and try again</li>
    </ol>
    <p>If you don't see the icon, check your browser's privacy settings.</p>
  `)
}
```

## State-Based Error Handling

Access error information from the state:

```typescript
// Check for errors in state
Micdrop.on('StateChange', (state) => {
  if (state.error) {
    console.error('Current error:', state.error.message)
    updateErrorDisplay(state.error)
  } else {
    clearErrorDisplay()
  }
})

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

## Network Error Handling

### Connection Monitoring

Monitor connection health:

```typescript
class ConnectionMonitor {
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 2000

  constructor() {
    // Monitor online/offline status
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))

    // Monitor Micdrop errors
    Micdrop.on('Error', this.handleMicdropError.bind(this))
  }

  private handleOffline() {
    console.log('Network connection lost')
    showWarning('Network connection lost. Attempting to reconnect...')
  }

  private handleOnline() {
    console.log('Network connection restored')
    if (!Micdrop.isStarted) {
      this.attemptReconnect()
    }
  }

  private async handleMicdropError(error) {
    if (error.code === 'Connection' && navigator.onLine) {
      await this.attemptReconnect()
    }
  }

  private async attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      showError('Unable to reconnect. Please refresh the page.')
      return
    }

    this.reconnectAttempts++
    console.log(
      `Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
    )

    try {
      await new Promise((resolve) => setTimeout(resolve, this.reconnectDelay))
      await Micdrop.start({ url: this.serverUrl })

      this.reconnectAttempts = 0
      showSuccess('Connection restored!')
    } catch (error) {
      console.error('Reconnection failed:', error)
      await this.attemptReconnect()
    }
  }
}

const connectionMonitor = new ConnectionMonitor()
```

## Error Logging

### Send Error Reports

Report errors to your analytics service:

```typescript
function reportError(error, context = {}) {
  const errorReport = {
    message: error.message,
    code: error.code,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    context,
  }

  // Send to your error reporting service
  fetch('/api/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(errorReport),
  }).catch((err) => {
    console.error('Failed to report error:', err)
  })
}

Micdrop.on('Error', (error) => {
  reportError(error, {
    micdropState: {
      isStarted: Micdrop.isStarted,
      isListening: Micdrop.isListening,
      micDeviceId: Micdrop.micDeviceId,
    },
  })
})
```

## Testing Error Scenarios

### Simulate Errors

Test your error handling:

```typescript
// Simulate different error types for testing
function simulateError(errorType) {
  const errorMap = {
    connection: new MicdropClientError(
      'Connection',
      'Simulated connection error'
    ),
    unauthorized: new MicdropClientError(
      'Unauthorized',
      'Simulated auth error'
    ),
    mic: new MicdropClientError('Mic', 'Simulated microphone error'),
  }

  const error = errorMap[errorType]
  if (error) {
    Micdrop.emit('Error', error)
  }
}

// Test error handling in development
if (process.env.NODE_ENV === 'development') {
  window.simulateError = simulateError
}
```

## Next Steps

- [**React Hooks**](./react-hooks) - Error handling in React applications
- [**State Management**](./utility-classes/micdrop-client) - Understanding error states
- [**Server Setup**](../server) - Configure server-side error handling
