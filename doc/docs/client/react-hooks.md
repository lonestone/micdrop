# React Hooks

React hooks for seamless integration of Micdrop voice conversations in React applications.

## Installation

```bash
npm install @micdrop/react
```

## Quick Start

```tsx
import { Micdrop } from '@micdrop/client'
import { useMicdropState, useMicdropError } from '@micdrop/react'

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

## Available Hooks

### useMicdropState

Get the complete Micdrop state and subscribe to changes:

```tsx
import { useMicdropState } from '@micdrop/react'

function CallStatus() {
  const state = useMicdropState()

  return (
    <div className="call-status">
      <div className="status-row">
        <span>Started:</span>
        <span>{state.isStarted ? '✅' : '❌'}</span>
      </div>

      <div className="status-row">
        <span>Listening:</span>
        <span>{state.isListening ? '🎤' : '🔇'}</span>
      </div>

      <div className="status-row">
        <span>Processing:</span>
        <span>{state.isProcessing ? '🤔' : '⏳'}</span>
      </div>

      <div className="status-row">
        <span>Assistant Speaking:</span>
        <span>{state.isAssistantSpeaking ? '🔊' : '🔇'}</span>
      </div>
    </div>
  )
}
```

### useMicdropError

Handle errors with a callback function:

```tsx
import { useMicdropError } from '@micdrop/react'
import { toast } from 'react-hot-toast'

function VoiceApp() {
  useMicdropError((error) => {
    switch (error.code) {
      case 'Mic':
        toast.error('Microphone error: Please check permissions')
        break
      case 'Connection':
        toast.error('Connection lost: Trying to reconnect...')
        break
      case 'Unauthorized':
        toast.error('Authentication failed: Please sign in')
        break
      default:
        toast.error(`Error: ${error.message}`)
    }
  })

  return <div>Your voice app content...</div>
}
```

### useMicdropEndCall

Handle call end events:

```tsx
import { useMicdropEndCall } from '@micdrop/react'
import { useRouter } from 'next/router'

function CallContainer() {
  const router = useRouter()

  useMicdropEndCall(() => {
    console.log('Call ended by assistant')

    // Navigate to end screen
    router.push('/call-ended')
  })

  return <div>Call in progress...</div>
}
```

### useMicVolume

Monitor microphone volume levels:

```tsx
import { useMicVolume } from '@micdrop/react'

function MicVolumeIndicator() {
  const { micVolume, maxMicVolume } = useMicVolume()

  // Convert dB to 0-100 range
  const normalizedVolume = Math.max(0, micVolume + 100)
  const normalizedMax = Math.max(0, maxMicVolume + 100)

  return (
    <div className="volume-indicator">
      <div className="volume-label">Microphone</div>
      <div className="volume-bar">
        <div
          className="volume-fill"
          style={{ width: `${normalizedVolume}%` }}
        />
        <div className="volume-max" style={{ left: `${normalizedMax}%` }} />
      </div>
      <div className="volume-value">{Math.round(normalizedVolume)}</div>
    </div>
  )
}
```

### useSpeakerVolume

Monitor speaker volume levels:

```tsx
import { useSpeakerVolume } from '@micdrop/react'

function SpeakerVolumeIndicator() {
  const { speakerVolume, maxSpeakerVolume } = useSpeakerVolume()

  const normalizedVolume = Math.max(0, speakerVolume + 100)
  const normalizedMax = Math.max(0, maxSpeakerVolume + 100)

  return (
    <div className="volume-indicator">
      <div className="volume-label">Speaker</div>
      <div className="volume-bar">
        <div
          className="volume-fill speaker"
          style={{ width: `${normalizedVolume}%` }}
        />
      </div>
      <div className="volume-value">{Math.round(normalizedVolume)}</div>
    </div>
  )
}
```

## Component Examples

### Complete Call Component

```tsx
import { useState } from 'react'
import { Micdrop } from '@micdrop/client'
import {
  useMicdropState,
  useMicdropError,
  useMicdropEndCall,
  useMicVolume,
} from '@micdrop/react'

function VoiceCallComponent() {
  const [serverUrl] = useState('ws://localhost:8081')
  const state = useMicdropState()
  const { micVolume } = useMicVolume()

  useMicdropError((error) => {
    alert(`Error: ${error.message}`)
  })

  useMicdropEndCall(() => {
    alert('Call ended by assistant')
  })

  const startCall = async () => {
    try {
      await Micdrop.start({
        url: serverUrl,
        vad: ['volume', 'silero'],
      })
    } catch (error) {
      console.error('Failed to start call:', error)
    }
  }

  const stopCall = async () => {
    await Micdrop.stop()
  }

  const togglePause = () => {
    if (state.isPaused) {
      Micdrop.resume()
    } else {
      Micdrop.pause()
    }
  }

  const getStatusMessage = () => {
    if (state.isStarting) return 'Starting call...'
    if (state.isPaused) return '⏸️ Call paused'
    if (state.isListening) return '🎤 Listening for your voice'
    if (state.isProcessing) return '🤔 Processing your message'
    if (state.isAssistantSpeaking) return '🔊 Assistant is speaking'
    if (state.isStarted) return '✅ Call connected'
    return 'Ready to start call'
  }

  return (
    <div className="voice-call">
      <h2>Voice Assistant</h2>

      <div className="status">{getStatusMessage()}</div>

      <div className="controls">
        {!state.isStarted ? (
          <button onClick={startCall} disabled={state.isStarting}>
            Start Call
          </button>
        ) : (
          <>
            <button onClick={togglePause}>
              {state.isPaused ? 'Resume' : 'Pause'}
            </button>
            <button onClick={stopCall}>Stop Call</button>
          </>
        )}
      </div>

      {state.isMicStarted && (
        <div className="volume">
          Mic Volume: {Math.max(0, micVolume + 100).toFixed(0)}
        </div>
      )}

      {state.conversation.length > 0 && (
        <div className="conversation">
          <h3>Conversation:</h3>
          {state.conversation.map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              <strong>{message.role === 'user' ? 'You' : 'Assistant'}:</strong>
              {message.content}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

### Device Settings Component

```tsx
import { useMicdropState } from '@micdrop/react'
import { Micdrop } from '@micdrop/client'

function DeviceSettings() {
  const state = useMicdropState()

  return (
    <div className="device-settings">
      <div className="device-group">
        <label htmlFor="mic-select">Microphone:</label>
        <select
          id="mic-select"
          value={state.micDeviceId || ''}
          onChange={(e) => Micdrop.changeMicDevice(e.target.value)}
        >
          {state.micDevices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || 'Unknown Device'}
            </option>
          ))}
        </select>
      </div>

      <div className="device-group">
        <label htmlFor="speaker-select">Speaker:</label>
        <select
          id="speaker-select"
          value={state.speakerDeviceId || ''}
          onChange={(e) => Micdrop.changeSpeakerDevice(e.target.value)}
        >
          {state.speakerDevices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || 'Unknown Device'}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
```

### Call Status Indicator

```tsx
import { useMicdropState } from '@micdrop/react'

function CallStatusIndicator() {
  const state = useMicdropState()

  const getStatus = () => {
    if (state.error) {
      return { icon: '❌', className: 'status-error', text: 'Error' }
    }
    if (state.isPaused) {
      return { icon: '⏸️', className: 'status-paused', text: 'Paused' }
    }
    if (state.isUserSpeaking) {
      return {
        icon: '🗣️',
        className: 'status-user-speaking',
        text: 'User Speaking',
      }
    }
    if (state.isListening) {
      return { icon: '🎤', className: 'status-listening', text: 'Listening' }
    }
    if (state.isProcessing) {
      return { icon: '🤔', className: 'status-processing', text: 'Processing' }
    }
    if (state.isAssistantSpeaking) {
      return { icon: '🔊', className: 'status-speaking', text: 'Speaking' }
    }
    if (state.isStarted) {
      return { icon: '✅', className: 'status-connected', text: 'Connected' }
    }
    return {
      icon: '⭕',
      className: 'status-disconnected',
      text: 'Disconnected',
    }
  }

  const status = getStatus()

  return (
    <div className={`status-indicator ${status.className}`}>
      <span className="status-icon">{status.icon}</span>
      <span className="status-text">{status.text}</span>
    </div>
  )
}
```

## Custom Hooks

### Create Custom Hooks

Build your own hooks for specific needs:

```tsx
import { useMicdropState } from '@micdrop/react'
import { useEffect, useState } from 'react'

// Custom hook for call duration
function useCallDuration() {
  const state = useMicdropState()
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    if (!state.isStarted) {
      setDuration(0)
      return
    }

    const interval = setInterval(() => {
      setDuration((d) => d + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [state.isStarted])

  return duration
}

// Custom hook for conversation stats
function useConversationStats() {
  const state = useMicdropState()

  const stats = useMemo(() => {
    const userMessages = state.conversation.filter((m) => m.role === 'user')
    const assistantMessages = state.conversation.filter(
      (m) => m.role === 'assistant'
    )

    return {
      totalMessages: state.conversation.length,
      userMessages: userMessages.length,
      assistantMessages: assistantMessages.length,
      averageUserLength:
        userMessages.reduce((sum, m) => sum + m.content.length, 0) /
          userMessages.length || 0,
      averageAssistantLength:
        assistantMessages.reduce((sum, m) => sum + m.content.length, 0) /
          assistantMessages.length || 0,
    }
  }, [state.conversation])

  return stats
}
```
