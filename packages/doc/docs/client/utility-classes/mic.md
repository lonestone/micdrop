# Mic

Direct microphone input management and audio recording with real-time analysis.

## Overview

The `Mic` utility class provides low-level access to microphone functionality, independent of the full Micdrop conversation system. Use this when you need direct microphone control without WebSocket communication or conversation management.

## Features

- 🎤 **Device Management** - Select and manage microphone input devices
- 🔊 **Audio Streaming** - Get raw microphone audio streams
- 📊 **Real-time Analysis** - Monitor volume and audio characteristics
- 💾 **Persistent Settings** - Automatically save device preferences

## Basic Usage

```typescript
import { Mic } from '@micdrop/client'

// Start microphone with default device
const stream = await Mic.start()
console.log('Microphone started:', stream)

// Start with specific device
const deviceStream = await Mic.start('specific-device-id')

// Stop microphone
Mic.stop()
```

## Audio Analysis

Monitor microphone input in real-time:

```typescript
// Listen for volume changes
Mic.analyser.on('volume', (volume: number) => {
  // Volume is in dB range -100 to 0
  const normalizedVolume = Math.max(0, volume + 100)
  console.log('Mic volume:', normalizedVolume)
  
  // Update volume meter UI
  updateVolumeMeter(normalizedVolume)
})

// Access the underlying AnalyserNode for custom analysis
const analyserNode = Mic.analyser.node
const dataArray = new Uint8Array(analyserNode.frequencyBinCount)

function analyzeAudio() {
  analyserNode.getByteFrequencyData(dataArray)
  
  // Custom audio analysis
  const averageFrequency = dataArray.reduce((a, b) => a + b) / dataArray.length
  console.log('Average frequency:', averageFrequency)
  
  requestAnimationFrame(analyzeAudio)
}

analyzeAudio()
```

## Device Selection

```typescript
// Get available microphone devices
const devices = await navigator.mediaDevices.enumerateDevices()
const micDevices = devices.filter(device => device.kind === 'audioinput')

console.log('Available microphones:')
micDevices.forEach(device => {
  console.log(`- ${device.label || 'Unknown Device'} (${device.deviceId})`)
})

// Start with specific device
await Mic.start(micDevices[0].deviceId)
```

## Volume Monitoring

Create a volume meter component:

```typescript
class VolumeMeter {
  private element: HTMLElement
  private isRunning = false
  
  constructor(containerId: string) {
    this.element = document.getElementById(containerId)
    this.setupMeter()
  }
  
  private setupMeter() {
    this.element.innerHTML = `
      <div class="volume-meter">
        <div class="volume-bar">
          <div class="volume-fill"></div>
        </div>
        <span class="volume-text">0</span>
      </div>
    `
  }
  
  start() {
    this.isRunning = true
    
    Mic.analyser.on('volume', this.updateMeter.bind(this))
  }
  
  stop() {
    this.isRunning = false
    Mic.analyser.off('volume', this.updateMeter.bind(this))
  }
  
  private updateMeter(volume: number) {
    if (!this.isRunning) return
    
    const normalizedVolume = Math.max(0, volume + 100)
    const fillElement = this.element.querySelector('.volume-fill')
    const textElement = this.element.querySelector('.volume-text')
    
    if (fillElement && textElement) {
      fillElement.style.width = `${normalizedVolume}%`
      textElement.textContent = Math.round(normalizedVolume).toString()
    }
  }
}

// Usage
const volumeMeter = new VolumeMeter('volume-container')

await Mic.start()
volumeMeter.start()
```

## Audio Stream Processing

Process raw microphone audio:

```typescript
import { Mic } from '@micdrop/client'

async function processAudioStream() {
  // Start microphone
  const stream = await Mic.start()
  
  // Create audio context for processing
  const audioContext = new AudioContext()
  const source = audioContext.createMediaStreamSource(stream)
  
  // Add custom audio processing
  const gainNode = audioContext.createGain()
  const filterNode = audioContext.createBiquadFilter()
  
  // Configure filter (e.g., high-pass filter for noise reduction)
  filterNode.type = 'highpass'
  filterNode.frequency.value = 200
  
  // Connect audio nodes
  source.connect(filterNode)
  filterNode.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  console.log('Audio processing started')
}
```

## Permission Handling

Manage microphone permissions gracefully:

```typescript
async function requestMicrophoneAccess() {
  try {
    // Try to start microphone
    await Mic.start()
    console.log('✅ Microphone access granted')
    return true
    
  } catch (error) {
    console.error('❌ Microphone access failed:', error)
    
    if (error.name === 'NotAllowedError') {
      showPermissionDialog()
    } else if (error.name === 'NotFoundError') {
      showNoMicrophoneDialog()
    } else {
      showGenericError(error.message)
    }
    
    return false
  }
}

function showPermissionDialog() {
  const dialog = document.createElement('div')
  dialog.innerHTML = `
    <div class="permission-dialog">
      <h3>Microphone Access Required</h3>
      <p>Please allow microphone access to continue:</p>
      <ol>
        <li>Click the microphone icon in your browser's address bar</li>
        <li>Select "Always allow" for this site</li>
        <li>Refresh the page and try again</li>
      </ol>
      <button onclick="this.parentElement.remove()">OK</button>
    </div>
  `
  document.body.appendChild(dialog)
}
```

## React Integration

Use Mic in React components:

```tsx
import { useEffect, useState } from 'react'
import { Mic } from '@micdrop/client'

function MicrophoneComponent() {
  const [isActive, setIsActive] = useState(false)
  const [volume, setVolume] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (isActive) {
      startMicrophone()
    } else {
      stopMicrophone()
    }
    
    return () => {
      stopMicrophone()
    }
  }, [isActive])
  
  const startMicrophone = async () => {
    try {
      await Mic.start()
      
      // Listen for volume changes
      const volumeListener = (vol: number) => {
        setVolume(Math.max(0, vol + 100))
      }
      
      Mic.analyser.on('volume', volumeListener)
      setError(null)
      
    } catch (err) {
      setError(err.message)
      setIsActive(false)
    }
  }
  
  const stopMicrophone = () => {
    Mic.stop()
    setVolume(0)
  }
  
  return (
    <div className="microphone-component">
      <button 
        onClick={() => setIsActive(!isActive)}
        className={isActive ? 'active' : ''}
      >
        {isActive ? '🎤 Stop' : '🎤 Start'} Microphone
      </button>
      
      {error && (
        <div className="error">Error: {error}</div>
      )}
      
      {isActive && (
        <div className="volume-display">
          <div className="volume-bar">
            <div 
              className="volume-fill"
              style={{ width: `${volume}%` }}
            />
          </div>
          <span>{Math.round(volume)}</span>
        </div>
      )}
    </div>
  )
}
```

## Advanced Usage

### Custom Audio Constraints

Configure audio quality and processing:

```typescript
// Start with custom audio constraints
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    deviceId: 'specific-device-id',
    sampleRate: 48000,
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  }
})

// Use the custom stream with Mic analyzer
const audioContext = new AudioContext()
const source = audioContext.createMediaStreamSource(stream)
source.connect(Mic.analyser.node)
```

### Audio Recording

Record audio chunks from microphone:

```typescript
class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private chunks: Blob[] = []
  
  async startRecording() {
    const stream = await Mic.start()
    
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    })
    
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data)
      }
    }
    
    this.mediaRecorder.start(1000) // Capture every second
    console.log('Recording started')
  }
  
  stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) return
      
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.chunks, { type: 'audio/webm' })
        this.chunks = []
        resolve(audioBlob)
      }
      
      this.mediaRecorder.stop()
      Mic.stop()
    })
  }
}
```

## Browser Compatibility

The Mic utility requires:

- ✅ **Chrome/Chromium** 60+ 
- ✅ **Firefox** 60+
- ✅ **Safari** 12+
- ✅ **Edge** 80+

**Required APIs:**
- MediaDevices.getUserMedia()
- Web Audio API
- MediaStream API

## Next Steps

- [**MicdropClient**](./micdrop-client) - Full conversation management
- [**MicRecorder**](./mic-recorder) - Audio recording with voice activity detection
- [**Speaker**](./speaker) - Audio output management