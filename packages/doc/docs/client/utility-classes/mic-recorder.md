# MicRecorder

Audio recording with voice activity detection, providing intelligent audio chunking based on speech detection.

## Overview

`MicRecorder` handles microphone recording with integrated Voice Activity Detection (VAD) to automatically capture audio chunks only when speech is detected. This class bridges the gap between raw microphone input and intelligent audio processing.

## Features

- 🧠 **Voice Activity Detection** - Multiple VAD algorithms (Volume, Silero, Custom)
- 📊 **Smart Audio Chunking** - Records only when speech is detected
- 🎵 **Multiple Formats** - Support for various audio formats with fallbacks
- 🔇 **Mute Control** - Temporarily disable recording while maintaining stream
- 📱 **State Management** - Complete recording state tracking
- ⚡ **Event-Driven** - React to speech events in real-time

## Basic Usage

```typescript
import { MicRecorder } from '@micdrop/client'

// Create recorder with VAD configuration
const recorder = new MicRecorder('volume')

// Get microphone stream
const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

// Start recording with speech detection
await recorder.start(stream)

// Listen for speech events
recorder.on('StartSpeaking', () => {
  console.log('🎤 User started speaking')
  showListeningIndicator()
})

recorder.on('StopSpeaking', () => {
  console.log('🔇 User stopped speaking')
  hideListeningIndicator()
})

// Handle audio chunks
recorder.on('Chunk', (blob: Blob) => {
  console.log('📦 Audio chunk received:', blob.size, 'bytes')
  sendAudioToServer(blob)
})
```

## Constructor Options

Configure the recorder with different VAD setups:

```typescript
// String-based VAD configuration
const recorder1 = new MicRecorder('volume')
const recorder2 = new MicRecorder('silero')

// Multiple VADs for better accuracy
const recorder3 = new MicRecorder(['volume', 'silero'])

// Custom VAD instance
import { SileroVAD } from '@micdrop/client'
const customVad = new SileroVAD({ positiveSpeechThreshold: 0.15 })
const recorder4 = new MicRecorder(customVad)

// Array of mixed configurations
const recorder5 = new MicRecorder(['volume', customVad])
```

## State Management

Track recording state in real-time:

```typescript
interface MicRecorderState {
  isStarting: boolean  // Whether the recorder is starting up
  isStarted: boolean   // Whether the recorder is active
  isMuted: boolean     // Whether recording is muted
  isSpeaking: boolean  // Whether speech is currently detected
}

// Access current state
console.log('Recorder state:', recorder.state)

// Listen for state changes
recorder.on('StateChange', (state) => {
  console.log('State updated:', state)
  
  if (state.isSpeaking) {
    startRecordingAnimation()
  } else {
    stopRecordingAnimation()
  }
})
```

## Audio Format Support

The recorder automatically selects the best available audio format:

```typescript
// Supported formats (in order of preference):
// 1. audio/ogg;codecs=opus
// 2. audio/webm;codecs=opus  
// 3. audio/mp4;codecs=mp4a.40.2
// 4. audio/wav

// Check which format is being used
recorder.on('StateChange', (state) => {
  if (state.isStarted) {
    console.log('Using audio format:', recorder.mimeType)
  }
})
```

## Voice Activity Detection Integration

Access and configure the integrated VAD:

```typescript
const recorder = new MicRecorder(['volume', 'silero'])

// Access VAD instance
console.log('VAD type:', recorder.vad.constructor.name)

// Listen to VAD events directly
recorder.vad.on('StartSpeaking', () => {
  console.log('VAD: Possible speech detected')
})

recorder.vad.on('ConfirmSpeaking', () => {
  console.log('VAD: Speech confirmed')
})

recorder.vad.on('CancelSpeaking', () => {
  console.log('VAD: False positive cancelled')
})

// Update VAD configuration
if (recorder.vad instanceof SileroVAD) {
  recorder.vad.options.positiveSpeechThreshold = 0.2
}
```

## Advanced Recording Control

### Mute/Unmute Functionality

```typescript
// Mute recording (keeps stream active but stops chunk generation)
recorder.mute()
console.log('Muted:', recorder.isMuted) // true

// Unmute recording
recorder.unmute()
console.log('Muted:', recorder.isMuted) // false

// Toggle mute state
function toggleMute() {
  if (recorder.isMuted) {
    recorder.unmute()
  } else {
    recorder.mute()
  }
}
```

### Custom Audio Processing

Process audio before recording:

```typescript
class CustomMicRecorder extends MicRecorder {
  private audioContext: AudioContext
  private processor: AudioWorkletNode
  
  async start(stream: MediaStream) {
    // Set up audio processing
    this.audioContext = new AudioContext()
    await this.audioContext.audioWorklet.addModule('/audio-processor.js')
    
    this.processor = new AudioWorkletNode(this.audioContext, 'audio-processor')
    
    // Connect audio pipeline
    const source = this.audioContext.createMediaStreamSource(stream)
    source.connect(this.processor)
    
    // Create processed stream
    const destination = this.audioContext.createMediaStreamDestination()
    this.processor.connect(destination)
    
    // Start recording with processed stream
    await super.start(destination.stream)
  }
}
```

## Real-World Integration Examples

### Chat Application Integration

```typescript
class VoiceChatRecorder {
  private recorder: MicRecorder
  private socket: WebSocket
  private isConnected = false
  
  constructor(serverUrl: string) {
    this.recorder = new MicRecorder(['volume', 'silero'])
    this.socket = new WebSocket(serverUrl)
    
    this.setupRecorderEvents()
    this.setupSocketEvents()
  }
  
  private setupRecorderEvents() {
    // Send audio chunks to server
    this.recorder.on('Chunk', (blob) => {
      if (this.isConnected) {
        this.socket.send(blob)
      }
    })
    
    // Notify server of speech events
    this.recorder.on('StartSpeaking', () => {
      this.socket.send(JSON.stringify({ type: 'start_speaking' }))
    })
    
    this.recorder.on('StopSpeaking', () => {
      this.socket.send(JSON.stringify({ type: 'stop_speaking' }))
    })
  }
  
  private setupSocketEvents() {
    this.socket.onopen = () => {
      this.isConnected = true
      console.log('Connected to voice server')
    }
    
    this.socket.onclose = () => {
      this.isConnected = false
      this.recorder.stop()
    }
  }
  
  async startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    await this.recorder.start(stream)
  }
  
  stopRecording() {
    this.recorder.stop()
    this.socket.close()
  }
}
```

### Recording Analytics

```typescript
class RecordingAnalytics {
  private recorder: MicRecorder
  private stats = {
    totalChunks: 0,
    totalAudioTime: 0,
    speechTime: 0,
    silenceTime: 0,
    startTime: Date.now()
  }
  
  constructor(vadConfig: VADConfig) {
    this.recorder = new MicRecorder(vadConfig)
    this.setupAnalytics()
  }
  
  private setupAnalytics() {
    let speechStartTime: number | null = null
    
    this.recorder.on('StartSpeaking', () => {
      speechStartTime = Date.now()
    })
    
    this.recorder.on('StopSpeaking', () => {
      if (speechStartTime) {
        const speechDuration = Date.now() - speechStartTime
        this.stats.speechTime += speechDuration
        speechStartTime = null
      }
    })
    
    this.recorder.on('Chunk', (blob) => {
      this.stats.totalChunks++
      // Estimate audio duration (100ms chunks)
      this.stats.totalAudioTime += 100
    })
  }
  
  getStats() {
    const totalTime = Date.now() - this.stats.startTime
    this.stats.silenceTime = totalTime - this.stats.speechTime
    
    return {
      ...this.stats,
      speechRatio: this.stats.speechTime / totalTime,
      chunksPerSecond: this.stats.totalChunks / (totalTime / 1000)
    }
  }
  
  async start(stream: MediaStream) {
    this.stats.startTime = Date.now()
    await this.recorder.start(stream)
  }
}
```

### Error Recovery

```typescript
class RobustMicRecorder {
  private recorder: MicRecorder
  private retryCount = 0
  private maxRetries = 3
  
  constructor(vadConfig: VADConfig) {
    this.recorder = new MicRecorder(vadConfig)
    this.setupErrorRecovery()
  }
  
  private setupErrorRecovery() {
    // Monitor for recording errors
    this.recorder.on('StateChange', (state) => {
      if (!state.isStarted && this.retryCount < this.maxRetries) {
        console.log('Recording stopped unexpectedly, attempting recovery...')
        this.retryRecording()
      }
    })
  }
  
  private async retryRecording() {
    this.retryCount++
    
    try {
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Restart microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      await this.recorder.start(stream)
      
      this.retryCount = 0 // Reset on success
      console.log('Recording recovery successful')
      
    } catch (error) {
      console.error('Recording recovery failed:', error)
      
      if (this.retryCount >= this.maxRetries) {
        console.error('Max retries reached, giving up')
        this.onRecordingFailure(error)
      }
    }
  }
  
  private onRecordingFailure(error: Error) {
    // Handle permanent recording failure
    alert('Microphone recording failed. Please check your permissions and try again.')
  }
}
```

## Performance Considerations

### Optimize Chunk Processing

```typescript
// Batch process chunks to reduce overhead
class BatchedMicRecorder {
  private recorder: MicRecorder
  private chunkBuffer: Blob[] = []
  private batchSize = 5
  
  constructor(vadConfig: VADConfig) {
    this.recorder = new MicRecorder(vadConfig)
    
    this.recorder.on('Chunk', (blob) => {
      this.chunkBuffer.push(blob)
      
      if (this.chunkBuffer.length >= this.batchSize) {
        this.processBatch()
      }
    })
  }
  
  private processBatch() {
    const batchBlob = new Blob(this.chunkBuffer, { type: 'audio/webm' })
    this.sendToServer(batchBlob)
    this.chunkBuffer = []
  }
}
```

## Browser Compatibility

MicRecorder requires:

- ✅ **MediaRecorder API** - For audio recording
- ✅ **Web Audio API** - For audio analysis  
- ✅ **MediaStream API** - For microphone access

**Browser Support:**
- Chrome/Chromium 47+
- Firefox 25+
- Safari 14.1+
- Edge 79+

## Next Steps

- [**VAD Documentation**](../vad) - Voice activity detection configuration
- [**Mic**](./mic) - Direct microphone control
- [**MicdropClient**](./micdrop-client) - Full conversation management