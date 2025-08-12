# Speaker

Audio output device management and streaming audio playback with real-time analysis.

## Overview

The `Speaker` utility class provides direct control over audio output devices and playback functionality. It handles streaming audio playback, device switching, and real-time audio analysis independently of the full conversation system.

## Features

- 🔊 **Device Management** - Select and manage audio output devices
- 🎵 **Streaming Playback** - Play audio with seamless streaming support  
- 📊 **Real-time Analysis** - Monitor output volume and audio characteristics
- 🔄 **Dynamic Switching** - Change output device during playback
- ⏯️ **Playback Control** - Start, stop, and monitor playback state
- 💾 **Persistent Settings** - Automatically save device preferences

## Basic Usage

```typescript
import { Speaker } from '@micdrop/client'

// Change to a specific output device
await Speaker.changeDevice('device-id')

// Play an audio blob (PCM s16le format)
const audioBlob = await fetch('/audio.wav').then(r => r.blob())
await Speaker.playAudio(audioBlob)

// Stop playback
Speaker.stopAudio()

// Monitor playback state
console.log('Is playing:', Speaker.isPlaying)
```

## Device Management

### Get Available Devices

```typescript
// Get available audio output devices
const devices = await navigator.mediaDevices.enumerateDevices()
const speakerDevices = devices.filter(device => device.kind === 'audiooutput')

console.log('Available speakers:')
speakerDevices.forEach(device => {
  console.log(`- ${device.label || 'Unknown Device'} (${device.deviceId})`)
})
```

### Change Output Device

```typescript
// Switch to a specific speaker/headphones
const deviceId = speakerDevices[1].deviceId
await Speaker.changeDevice(deviceId)

console.log('Switched to:', deviceId)

// Device selection is automatically persisted
// Next session will use the same device
```

### Device Selection UI

Create a device selector:

```typescript
function createSpeakerSelector() {
  const select = document.createElement('select')
  select.id = 'speakerSelect'
  
  // Populate options
  navigator.mediaDevices.enumerateDevices().then(devices => {
    const speakers = devices.filter(d => d.kind === 'audiooutput')
    
    speakers.forEach(device => {
      const option = document.createElement('option')
      option.value = device.deviceId
      option.textContent = device.label || 'Unknown Speaker'
      select.appendChild(option)
    })
  })
  
  // Handle changes
  select.addEventListener('change', async (e) => {
    await Speaker.changeDevice(e.target.value)
    console.log('Speaker changed to:', e.target.value)
  })
  
  return select
}

// Add to page
document.body.appendChild(createSpeakerSelector())
```

## Audio Playback

### Play Audio Blobs

```typescript
// Play a single audio blob
async function playAudioFile(url: string) {
  try {
    const response = await fetch(url)
    const audioBlob = await response.blob()
    
    await Speaker.playAudio(audioBlob)
    console.log('Audio playback started')
    
  } catch (error) {
    console.error('Playback failed:', error)
  }
}

// Play streaming audio chunks
async function playStreamingAudio(audioChunks: Blob[]) {
  for (const chunk of audioChunks) {
    await Speaker.playAudio(chunk)
    
    // Small delay between chunks for smooth playback
    await new Promise(resolve => setTimeout(resolve, 10))
  }
}
```

### Monitor Playback State

```typescript
// Listen for playback events
Speaker.on('StartPlaying', () => {
  console.log('🔊 Audio playback started')
  showPlayingIndicator()
})

Speaker.on('StopPlaying', () => {
  console.log('🔇 Audio playback stopped')
  hidePlayingIndicator()
})

// Check current state
if (Speaker.isPlaying) {
  console.log('Audio is currently playing')
} else {
  console.log('Audio is not playing')
}
```

## Audio Analysis

Monitor output volume and characteristics:

```typescript
// Listen for volume changes
Speaker.analyser.on('volume', (volume: number) => {
  // Volume is in dB range -100 to 0
  const normalizedVolume = Math.max(0, volume + 100)
  console.log('Speaker volume:', normalizedVolume)
  
  // Update volume visualization
  updateVolumeDisplay(normalizedVolume)
})

// Access the underlying AnalyserNode
const analyserNode = Speaker.analyser.node
const dataArray = new Uint8Array(analyserNode.frequencyBinCount)

function analyzeOutput() {
  analyserNode.getByteFrequencyData(dataArray)
  
  // Custom audio analysis
  const maxVolume = Math.max(...dataArray)
  const averageVolume = dataArray.reduce((a, b) => a + b) / dataArray.length
  
  console.log('Max volume:', maxVolume, 'Average:', averageVolume)
  
  requestAnimationFrame(analyzeOutput)
}

analyzeOutput()
```

## React Integration

Use Speaker in React components:

```tsx
import { useEffect, useState } from 'react'
import { Speaker } from '@micdrop/client'

function SpeakerComponent() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDevice, setSelectedDevice] = useState('')
  
  useEffect(() => {
    // Load available devices
    loadSpeakerDevices()
    
    // Set up event listeners
    const handleStartPlaying = () => setIsPlaying(true)
    const handleStopPlaying = () => setIsPlaying(false)
    const handleVolumeChange = (vol: number) => {
      setVolume(Math.max(0, vol + 100))
    }
    
    Speaker.on('StartPlaying', handleStartPlaying)
    Speaker.on('StopPlaying', handleStopPlaying)
    Speaker.analyser.on('volume', handleVolumeChange)
    
    // Cleanup
    return () => {
      Speaker.off('StartPlaying', handleStartPlaying)
      Speaker.off('StopPlaying', handleStopPlaying)
      Speaker.analyser.off('volume', handleVolumeChange)
    }
  }, [])
  
  const loadSpeakerDevices = async () => {
    const allDevices = await navigator.mediaDevices.enumerateDevices()
    const speakers = allDevices.filter(d => d.kind === 'audiooutput')
    setDevices(speakers)
    
    if (speakers.length > 0) {
      setSelectedDevice(speakers[0].deviceId)
    }
  }
  
  const changeDevice = async (deviceId: string) => {
    await Speaker.changeDevice(deviceId)
    setSelectedDevice(deviceId)
  }
  
  const playTestSound = async () => {
    // Generate a test tone
    const audioContext = new AudioContext()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 440 // A note
    gainNode.gain.value = 0.1 // Low volume
    
    oscillator.start()
    setTimeout(() => {
      oscillator.stop()
      audioContext.close()
    }, 1000)
  }
  
  return (
    <div className="speaker-component">
      <h3>Audio Output</h3>
      
      <div className="device-selection">
        <label>Output Device:</label>
        <select 
          value={selectedDevice} 
          onChange={(e) => changeDevice(e.target.value)}
        >
          {devices.map(device => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || 'Unknown Device'}
            </option>
          ))}
        </select>
      </div>
      
      <div className="playback-controls">
        <button onClick={playTestSound}>
          Test Speaker
        </button>
        
        <button 
          onClick={Speaker.stopAudio}
          disabled={!isPlaying}
        >
          Stop Audio
        </button>
      </div>
      
      <div className="volume-display">
        <label>Volume:</label>
        <div className="volume-bar">
          <div 
            className="volume-fill"
            style={{ width: `${volume}%` }}
          />
        </div>
        <span>{Math.round(volume)}</span>
      </div>
      
      <div className="status">
        {isPlaying ? '🔊 Playing' : '🔇 Silent'}
      </div>
    </div>
  )
}
```

## Advanced Usage

### Custom Audio Processing

Apply effects to output audio:

```typescript
class AdvancedSpeaker {
  private audioContext: AudioContext
  private gainNode: GainNode
  private filterNode: BiquadFilterNode
  
  constructor() {
    this.audioContext = new AudioContext()
    this.setupAudioChain()
  }
  
  private setupAudioChain() {
    // Create audio processing nodes
    this.gainNode = this.audioContext.createGain()
    this.filterNode = this.audioContext.createBiquadFilter()
    
    // Configure filter (e.g., bass boost)
    this.filterNode.type = 'lowshelf'
    this.filterNode.frequency.value = 200
    this.filterNode.gain.value = 5
    
    // Connect nodes
    this.filterNode.connect(this.gainNode)
    this.gainNode.connect(this.audioContext.destination)
  }
  
  async playWithEffects(audioBlob: Blob) {
    const arrayBuffer = await audioBlob.arrayBuffer()
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
    
    const source = this.audioContext.createBufferSource()
    source.buffer = audioBuffer
    source.connect(this.filterNode)
    
    source.start()
    
    return new Promise(resolve => {
      source.onended = resolve
    })
  }
  
  setVolume(volume: number) {
    this.gainNode.gain.value = volume
  }
  
  setBassBoost(gain: number) {
    this.filterNode.gain.value = gain
  }
}
```

### Audio Queue Management

Manage multiple audio clips:

```typescript
class AudioQueue {
  private queue: Blob[] = []
  private isPlaying = false
  
  add(audioBlob: Blob) {
    this.queue.push(audioBlob)
    
    if (!this.isPlaying) {
      this.playNext()
    }
  }
  
  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false
      return
    }
    
    this.isPlaying = true
    const audioBlob = this.queue.shift()
    
    try {
      await Speaker.playAudio(audioBlob)
    } catch (error) {
      console.error('Playback error:', error)
    }
    
    // Play next item
    setTimeout(() => this.playNext(), 100)
  }
  
  clear() {
    this.queue = []
    Speaker.stopAudio()
    this.isPlaying = false
  }
  
  get length() {
    return this.queue.length
  }
}

// Usage
const audioQueue = new AudioQueue()

// Add audio files to queue
audioQueue.add(audioBlob1)
audioQueue.add(audioBlob2)
audioQueue.add(audioBlob3)

// Queue automatically plays in order
```

### Audio Recording from Output

Capture what's being played:

```typescript
class OutputRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private chunks: Blob[] = []
  
  async startRecording() {
    // Capture audio from the speaker's audio context
    const stream = Speaker.analyser.node.context.createMediaStreamDestination()
    Speaker.analyser.node.connect(stream)
    
    this.mediaRecorder = new MediaRecorder(stream.stream, {
      mimeType: 'audio/webm;codecs=opus'
    })
    
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data)
      }
    }
    
    this.mediaRecorder.start(1000) // Capture every second
    console.log('Started recording speaker output')
  }
  
  stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) return
      
      this.mediaRecorder.onstop = () => {
        const recordedBlob = new Blob(this.chunks, { type: 'audio/webm' })
        this.chunks = []
        resolve(recordedBlob)
      }
      
      this.mediaRecorder.stop()
    })
  }
}
```

## Error Handling

Handle speaker errors gracefully:

```typescript
async function safePlayAudio(audioBlob: Blob) {
  try {
    await Speaker.playAudio(audioBlob)
    console.log('Audio played successfully')
    
  } catch (error) {
    console.error('Playback failed:', error)
    
    if (error.name === 'NotSupportedError') {
      console.error('Audio format not supported')
      showFormatError()
    } else if (error.name === 'NotAllowedError') {
      console.error('Audio playback not allowed')
      showPermissionError()
    } else {
      console.error('Generic playback error')
      showGenericError(error.message)
    }
  }
}

async function safeSwitchDevice(deviceId: string) {
  try {
    await Speaker.changeDevice(deviceId)
    console.log('Device switched successfully')
    
  } catch (error) {
    console.error('Device switch failed:', error)
    
    if (error.name === 'NotFoundError') {
      console.error('Device not found')
      refreshDeviceList()
    } else {
      console.error('Generic device error')
      showDeviceError(error.message)
    }
  }
}
```

## Browser Compatibility

Speaker utility requires:

- ✅ **Web Audio API** - For audio processing and analysis
- ✅ **HTMLMediaElement.setSinkId()** - For device selection (Chrome/Edge)
- ✅ **AudioContext.setSinkId()** - Alternative device selection (newer browsers)

**Browser Support:**
- Chrome/Chromium 49+ (full support)
- Firefox 70+ (limited device selection)
- Safari 14.1+ (limited device selection)
- Edge 79+ (full support)

## Next Steps

- [**Mic**](./mic) - Microphone input management
- [**MicRecorder**](./mic-recorder) - Audio recording with VAD
- [**MicdropClient**](./micdrop-client) - Full conversation management