# MicdropClient

Core client class for managing real-time audio communication, WebSocket connections, and voice conversation state.

## Overview

`MicdropClient` is the main class that orchestrates voice conversations by combining microphone recording, WebSocket communication, and audio playback. While most users interact with the `Micdrop` singleton, you can create custom instances for advanced scenarios.

## Features

- 🌐 **WebSocket Communication** - Real-time audio streaming to server
- 🎤 **Microphone Management** - Voice activity detection and audio recording
- 🔊 **Audio Playback** - Streaming audio playback from server
- 📊 **State Management** - Complete conversation state tracking
- 🎛️ **Device Control** - Microphone and speaker device selection
- 🛡️ **Error Handling** - Comprehensive error management

## Basic Usage

```typescript
import { MicdropClient } from '@micdrop/client'

// Create client instance
const client = new MicdropClient({
  url: 'ws://localhost:8080',
  vad: ['volume', 'silero'],
  debugLog: true
})

// Start conversation
await client.start()

// Listen for state changes
client.on('StateChange', (state) => {
  console.log('Conversation state:', state)
})

// Stop conversation
await client.stop()
```

## Constructor Options

Configure the client with various options:

```typescript
interface MicdropOptions {
  // Required: WebSocket server URL
  url: string
  
  // Optional: Parameters sent to server
  params?: Record<string, any>
  
  // Optional: Voice Activity Detection configuration
  vad?: VADConfig
  
  // Optional: Disable interruption when assistant speaks
  disableInterruption?: boolean
  
  // Optional: Enable debug logging
  debugLog?: boolean
}

const client = new MicdropClient({
  url: 'wss://your-server.com/ws',
  params: {
    authorization: 'Bearer token',
    language: 'en-US',
    model: 'gpt-4'
  },
  vad: ['volume', 'silero'],
  disableInterruption: false,
  debugLog: process.env.NODE_ENV === 'development'
})
```

## State Management

Access the complete conversation state:

```typescript
interface MicdropState {
  // Connection and startup state
  isStarting: boolean           // True if WebSocket or microphone are starting
  isStarted: boolean           // True if both WebSocket and microphone are active
  
  // Conversation flow state  
  isPaused: boolean            // True if microphone is paused by user
  isListening: boolean         // True if actively listening for speech
  isProcessing: boolean        // True if processing user message
  isUserSpeaking: boolean      // True if user is currently speaking
  isAssistantSpeaking: boolean // True if assistant is currently speaking
  
  // Microphone state
  isMicStarted: boolean        // True if microphone stream is active
  isMicMuted: boolean          // True if microphone is muted
  micDeviceId: string | undefined
  
  // Speaker state
  speakerDeviceId: string | undefined
  
  // Device lists
  micDevices: MediaDeviceInfo[]
  speakerDevices: MediaDeviceInfo[]
  
  // Conversation data
  conversation: MicdropConversation
  
  // Error state
  error: MicdropClientError | undefined
}

// Access state
console.log('Current state:', client.state)
console.log('Is listening:', client.isListening)
console.log('Is started:', client.isStarted)
```

## Events

Listen for client events:

```typescript
// State changes
client.on('StateChange', (state: MicdropState) => {
  console.log('State updated:', state)
  updateUI(state)
})

// Call ended by assistant
client.on('EndCall', () => {
  console.log('Call ended by assistant')
  showEndCallDialog()
})

// Error handling
client.on('Error', (error: MicdropClientError) => {
  console.error('Client error:', error.code, error.message)
  handleError(error)
})
```

## Methods

### Core Methods

```typescript
// Start the conversation
await client.start(options?: MicdropOptions): Promise<void>

// Stop the conversation  
await client.stop(): Promise<void>

// Pause conversation (mute microphone)
client.pause(): void

// Resume conversation (unmute microphone)
client.resume(): void
```

### Microphone Control

```typescript
// Start microphone with options
await client.startMic({
  vad: ['volume', 'silero'],
  deviceId: 'specific-device-id',
  record: true
}): Promise<void>

// Change microphone device
await client.changeMicDevice(deviceId: string): Promise<void>
```

### Speaker Control

```typescript
// Change speaker device
await client.changeSpeakerDevice(deviceId: string): Promise<void>
```

## Multiple Instances

Create multiple client instances for advanced scenarios:

```typescript
// Different conversations with different servers
const client1 = new MicdropClient({
  url: 'ws://server1.com/ws',
  params: { language: 'en' }
})

const client2 = new MicdropClient({
  url: 'ws://server2.com/ws', 
  params: { language: 'fr' }
})

// Start both conversations
await Promise.all([
  client1.start(),
  client2.start()
])
```

## Custom Event Handling

Advanced event handling patterns:

```typescript
class ConversationManager {
  private client: MicdropClient
  private conversationHistory: Array<{timestamp: Date, message: any}> = []
  
  constructor(serverUrl: string) {
    this.client = new MicdropClient({ url: serverUrl })
    this.setupEventHandlers()
  }
  
  private setupEventHandlers() {
    // Log all state changes
    this.client.on('StateChange', (state) => {
      this.logStateChange(state)
      this.handleStateChange(state)
    })
    
    // Handle errors with retry logic
    this.client.on('Error', (error) => {
      this.handleError(error)
    })
    
    // Track conversation end
    this.client.on('EndCall', () => {
      this.saveConversation()
    })
  }
  
  private logStateChange(state: MicdropState) {
    this.conversationHistory.push({
      timestamp: new Date(),
      message: {
        type: 'state_change',
        isListening: state.isListening,
        isProcessing: state.isProcessing,
        isAssistantSpeaking: state.isAssistantSpeaking
      }
    })
  }
  
  private handleStateChange(state: MicdropState) {
    // Update UI based on state
    if (state.isListening) {
      this.showListeningIndicator()
    } else if (state.isProcessing) {
      this.showProcessingIndicator()
    } else if (state.isAssistantSpeaking) {
      this.showSpeakingIndicator()
    }
  }
  
  private async handleError(error: MicdropClientError) {
    console.error('Conversation error:', error)
    
    // Implement retry logic for recoverable errors
    if (error.code === 'Connection' && this.retryCount < 3) {
      await this.retryConnection()
    } else {
      this.showErrorDialog(error)
    }
  }
  
  async start() {
    await this.client.start()
  }
  
  async stop() {
    await this.client.stop()
    this.saveConversation()
  }
  
  private saveConversation() {
    // Save conversation history
    localStorage.setItem('conversation_history', JSON.stringify(this.conversationHistory))
  }
}
```

## Integration with Custom Components

Integrate MicdropClient with custom UI components:

```typescript
class VoiceCallWidget {
  private client: MicdropClient
  private container: HTMLElement
  
  constructor(containerId: string, serverUrl: string) {
    this.container = document.getElementById(containerId)
    this.client = new MicdropClient({ url: serverUrl })
    
    this.createUI()
    this.setupEventHandlers()
  }
  
  private createUI() {
    this.container.innerHTML = `
      <div class="voice-call-widget">
        <div class="status" id="status">Ready to start</div>
        <div class="controls">
          <button id="startBtn">Start Call</button>
          <button id="pauseBtn" disabled>Pause</button>
          <button id="stopBtn" disabled>Stop Call</button>
        </div>
        <div class="volume-meters">
          <div class="mic-volume">
            <label>Microphone</label>
            <div class="volume-bar" id="micVolume"></div>
          </div>
          <div class="speaker-volume">
            <label>Speaker</label>
            <div class="volume-bar" id="speakerVolume"></div>
          </div>
        </div>
      </div>
    `
  }
  
  private setupEventHandlers() {
    // Button handlers
    document.getElementById('startBtn').addEventListener('click', () => {
      this.start()
    })
    
    document.getElementById('pauseBtn').addEventListener('click', () => {
      this.togglePause()
    })
    
    document.getElementById('stopBtn').addEventListener('click', () => {
      this.stop()
    })
    
    // Client event handlers
    this.client.on('StateChange', (state) => {
      this.updateUI(state)
    })
  }
  
  private updateUI(state: MicdropState) {
    const statusElement = document.getElementById('status')
    const startBtn = document.getElementById('startBtn') as HTMLButtonElement
    const pauseBtn = document.getElementById('pauseBtn') as HTMLButtonElement
    const stopBtn = document.getElementById('stopBtn') as HTMLButtonElement
    
    if (state.isListening) {
      statusElement.textContent = '🎤 Listening...'
    } else if (state.isProcessing) {
      statusElement.textContent = '🤔 Processing...'
    } else if (state.isAssistantSpeaking) {
      statusElement.textContent = '🔊 Assistant speaking...'
    } else if (state.isStarted) {
      statusElement.textContent = '✅ Connected'
    }
    
    // Update button states
    startBtn.disabled = state.isStarted || state.isStarting
    pauseBtn.disabled = !state.isStarted
    stopBtn.disabled = !state.isStarted
    
    pauseBtn.textContent = state.isPaused ? 'Resume' : 'Pause'
  }
  
  async start() {
    try {
      await this.client.start()
    } catch (error) {
      console.error('Failed to start call:', error)
    }
  }
  
  togglePause() {
    if (this.client.isPaused) {
      this.client.resume()
    } else {
      this.client.pause()
    }
  }
  
  async stop() {
    await this.client.stop()
  }
}

// Usage
const widget = new VoiceCallWidget('voice-widget', 'ws://localhost:8080')
```

## Error Handling

Comprehensive error management:

```typescript
client.on('Error', (error: MicdropClientError) => {
  switch (error.code) {
    case 'MissingUrl':
      console.error('Server URL is required')
      showConfigurationError()
      break
      
    case 'Connection':
      console.error('Failed to connect to server')
      attemptReconnection()
      break
      
    case 'Mic':
      console.error('Microphone error:', error.message)
      handleMicrophoneError(error)
      break
      
    case 'Unauthorized':
      console.error('Authentication failed')
      redirectToLogin()
      break
      
    default:
      console.error('Unknown error:', error.message)
      showGenericError(error)
  }
})
```

## Performance Optimization

Optimize client performance:

```typescript
// Lazy load VAD for better startup performance
const client = new MicdropClient({
  url: 'ws://localhost:8080',
  vad: 'volume' // Start with lightweight VAD
})

// Upgrade to AI VAD after connection
client.on('StateChange', (state) => {
  if (state.isStarted && client.vad.constructor.name === 'VolumeVAD') {
    // Upgrade to Silero VAD for better accuracy
    client.micRecorder.setVAD(['volume', 'silero'])
  }
})
```

## Next Steps

- [**Mic**](./mic) - Direct microphone control
- [**MicRecorder**](./mic-recorder) - Audio recording with VAD
- [**Speaker**](./speaker) - Audio output management