# VAD (Voice Activity Detection)

Voice Activity Detection determines when you're speaking to optimize audio streaming and conversation flow. Micdrop supports multiple VAD algorithms for accurate speech detection.

## Quick Start

Configure VAD when starting a call:

```typescript
import { Micdrop } from '@micdrop/client'

// Use volume-based detection (default)
await Micdrop.start({
  url: 'ws://localhost:8080',
  vad: 'volume'
})

// Use AI-based detection for better accuracy
await Micdrop.start({
  url: 'ws://localhost:8080',
  vad: 'silero'
})

// Combine multiple VADs for best results
await Micdrop.start({
  url: 'ws://localhost:8080',
  vad: ['volume', 'silero']
})
```

## Volume VAD

Volume-based speech detection using audio amplitude analysis.

### Basic Usage
```typescript
await Micdrop.start({
  vad: 'volume'
})
```

### Custom Configuration
```typescript
import { VolumeVAD } from '@micdrop/client'

const volumeVad = new VolumeVAD({
  history: 5,     // Number of frames to consider (default: 5)
  threshold: -55  // Volume threshold in decibels (default: -55)
})

await Micdrop.start({
  vad: volumeVad
})
```

**When to use Volume VAD:**
- ✅ Low latency requirements
- ✅ Quiet environments  
- ✅ Clear speech patterns
- ❌ Noisy environments
- ❌ Soft-spoken users

## Silero VAD

AI-powered speech detection using machine learning models.

### Basic Usage
```typescript
await Micdrop.start({
  vad: 'silero'
})
```

### Custom Configuration
```typescript
import { SileroVAD } from '@micdrop/client'

const sileroVad = new SileroVAD({
  positiveSpeechThreshold: 0.18, // Threshold for detecting speech (default: 0.18)
  negativeSpeechThreshold: 0.11, // Threshold for detecting silence (default: 0.11) 
  minSpeechFrames: 8,            // Min frames to confirm speech (default: 8)
  redemptionFrames: 20           // Frames to wait before confirming silence (default: 20)
})

await Micdrop.start({
  vad: sileroVad
})
```

**When to use Silero VAD:**
- ✅ Noisy environments
- ✅ Soft-spoken users
- ✅ Multiple speakers
- ✅ Background music/TV
- ❌ Extremely low latency needs (adds ~50ms processing)

## Multiple VAD

Combine multiple VAD algorithms for optimal accuracy:

```typescript
// Use both volume and AI detection
await Micdrop.start({
  vad: ['volume', 'silero']
})

// Mix string names and instances
await Micdrop.start({
  vad: ['volume', new SileroVAD({ positiveSpeechThreshold: 0.15 })]
})
```

### How Multiple VADs Work

When using multiple VADs:

1. **StartSpeaking** - Triggered when *any* VAD detects possible speech
2. **ConfirmSpeaking** - Triggered when *all* VADs confirm speech  
3. **StopSpeaking** - Triggered when *all* VADs detect silence
4. **CancelSpeaking** - Triggered if all VADs agree speech was false positive

This approach reduces false positives while maintaining quick response times.

## VAD Events

Monitor VAD activity in your application:

```typescript
Micdrop.vad.on('StartSpeaking', () => {
  console.log('🎤 Possible speech detected...')
  showListeningIndicator()
})

Micdrop.vad.on('ConfirmSpeaking', () => {
  console.log('✅ Speech confirmed - recording')
  highlightMicrophoneButton()
})

Micdrop.vad.on('StopSpeaking', () => {
  console.log('🔇 Speech ended')
  resetMicrophoneButton()
})

Micdrop.vad.on('CancelSpeaking', () => {
  console.log('❌ False positive - not speech')
  hideListeningIndicator()
})

Micdrop.vad.on('ChangeStatus', (status) => {
  console.log('VAD status:', status) // 'Silence', 'MaybeSpeaking', 'Speaking'
})
```

## Custom VAD

Create your own VAD implementation:

```typescript
import { VAD } from '@micdrop/client'

class CustomVAD extends VAD {
  private started = false
  private audioContext: AudioContext
  private analyzer: AnalyserNode
  
  get isStarted(): boolean {
    return this.started
  }

  async start(stream: MediaStream) {
    this.started = true
    
    // Set up audio analysis
    this.audioContext = new AudioContext()
    this.analyzer = this.audioContext.createAnalyser()
    
    const source = this.audioContext.createMediaStreamSource(stream)
    source.connect(this.analyzer)
    
    // Start your detection logic
    this.detectSpeech()
  }

  async stop() {
    this.started = false
    this.audioContext?.close()
  }
  
  private detectSpeech() {
    // Implement your speech detection logic
    const dataArray = new Uint8Array(this.analyzer.frequencyBinCount)
    
    const analyze = () => {
      if (!this.started) return
      
      this.analyzer.getByteFrequencyData(dataArray)
      
      // Your custom detection algorithm
      const isSpeaking = this.customDetection(dataArray)
      
      if (isSpeaking) {
        this.emit('StartSpeaking')
        this.emit('ConfirmSpeaking')
      } else {
        this.emit('StopSpeaking')
      }
      
      requestAnimationFrame(analyze)
    }
    
    analyze()
  }
  
  private customDetection(audioData: Uint8Array): boolean {
    // Your custom speech detection logic here
    // Return true if speech is detected, false otherwise
    return false
  }
}

// Use your custom VAD
await Micdrop.start({
  vad: new CustomVAD()
})
```

## Tuning VAD Performance

### Volume VAD Tuning

Adjust sensitivity based on environment:

```typescript
// Quiet environment - more sensitive
const quietVad = new VolumeVAD({
  threshold: -65, // Lower threshold for quiet voices
  history: 3      // Faster response
})

// Noisy environment - less sensitive  
const noisyVad = new VolumeVAD({
  threshold: -45, // Higher threshold to ignore noise
  history: 8      // More frames for stability
})
```

### Silero VAD Tuning

Fine-tune AI detection:

```typescript
// More sensitive - catches quiet speech
const sensitiveVad = new SileroVAD({
  positiveSpeechThreshold: 0.15, // Lower threshold
  minSpeechFrames: 6             // Faster confirmation
})

// More conservative - reduces false positives
const conservativeVad = new SileroVAD({
  positiveSpeechThreshold: 0.22, // Higher threshold  
  minSpeechFrames: 12,           // More confirmation needed
  redemptionFrames: 30           // Longer silence confirmation
})
```

## Persistent Settings

VAD settings are automatically saved to localStorage and restored:

```typescript
// Settings are saved automatically
await Micdrop.start({
  vad: new VolumeVAD({ threshold: -50 })
})

// On next session, settings are restored
await Micdrop.start({
  vad: 'volume' // Will use saved threshold of -50
})
```

## Best Practices

### Environment Adaptation
```typescript
// Detect environment and choose appropriate VAD
function getOptimalVAD() {
  const isQuietEnvironment = measureAmbientNoise() < -70
  const hasGoodMicrophone = checkMicrophoneQuality()
  
  if (isQuietEnvironment && hasGoodMicrophone) {
    return 'volume' // Fast and accurate
  } else {
    return ['volume', 'silero'] // Robust combination
  }
}

await Micdrop.start({
  vad: getOptimalVAD()
})
```

### User Calibration
```typescript
// Let users test and adjust VAD settings
function calibrateVAD() {
  const vad = new VolumeVAD({ threshold: -55 })
  
  // Show calibration UI
  showCalibrationDialog({
    onThresholdChange: (newThreshold) => {
      vad.threshold = newThreshold
    },
    onTest: () => {
      return vad.detectSpeech() // Test current settings
    }
  })
  
  return vad
}
```

## Troubleshooting

### Common Issues

**VAD too sensitive (false positives):**
```typescript
// Increase thresholds or use multiple VADs
await Micdrop.start({
  vad: new VolumeVAD({ threshold: -40 }) // Less sensitive
})
```

**VAD not sensitive enough (missed speech):**
```typescript
// Decrease thresholds or use Silero VAD
await Micdrop.start({
  vad: new SileroVAD({ positiveSpeechThreshold: 0.12 }) // More sensitive
})
```

**Inconsistent detection:**
```typescript
// Use multiple VADs for stability
await Micdrop.start({
  vad: ['volume', 'silero'] // Best of both algorithms
})
```

## Next Steps

- [**Device Management**](./devices-management) - Select optimal microphone for VAD
- [**Error Handling**](./error-handling) - Handle VAD-related errors
- [**React Hooks**](./react-hooks) - VAD integration in React apps