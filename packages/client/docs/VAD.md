# Voice Activity Detection (VAD)

Micdrop uses a VAD (Voice Activity Detection) to detect speech and silence and send chunks of audio to server only when speech is detected.

## Volume VAD: Speech detection based on volume

By default, the `CallClient` uses the `VolumeVAD` for speech detection, you can use it explicitly:

```typescript
const call = CallClient.getInstance<YourParamsType>({ vad: 'volume' })
```

It is inspired by the [hark](https://github.com/otalk/hark) library and triggers speech detection events based on volume changes.

You can also pass an instance of the `VolumeVAD` to the `CallClient`:

```typescript
const vad = new VolumeVAD({
  history: 5, // Number of frames to consider for volume calculation
  threshold: -50, // Threshold in decibels for speech detection
})
const call = CallClient.getInstance<YourParamsType>({ vad })
```

## Silero VAD: Human speech detection with AI

Alternatively, you can use the `SileroVAD` for speech detection:

```typescript
const call = CallClient.getInstance<YourParamsType>({ vad: 'silero' })
```

It is based on the [@ricky0123/vad-web](https://github.com/ricky0123/vad) library which runs a [Silero VAD](https://github.com/snakers4/silero-vad) model in the browser using [ONNX Runtime Web](https://github.com/microsoft/onnxruntime/tree/main/js/web).

It is more accurate than the `VolumeVAD` and works better with low voice.

You can also pass an instance of the `SileroVAD` to the `CallClient`:

```typescript
const vad = new SileroVAD({
  positiveSpeechThreshold: 0.18, // Threshold for positive speech detection
  negativeSpeechThreshold: 0.11, // Threshold for negative speech detection
  minSpeechFrames: 8, // Minimum number of frames to consider for speech detection
  redemptionFrames: 20, // Number of frames to consider for silence detection
})
const call = CallClient.getInstance<YourParamsType>({ vad })
```

## Multiple VAD: Combine multiple VADs

Combining multiple VADs is useful to get a more accurate speech detection:

- Volume to ignore low voice
- Silero to detect human speech

You can combine multiple VADs by passing an array of VAD names:

```typescript
const call = CallClient.getInstance<YourParamsType>({
  vad: ['volume', 'silero'],
})
```

You can also pass an array of VAD instances:

```typescript
const vad = [new VolumeVAD(), new SileroVAD()]
const call = CallClient.getInstance<YourParamsType>({ vad })
```

Or mix names and instances.

## Custom VAD

You can also pass your own VAD implementation:

```typescript
const call = CallClient.getInstance<YourParamsType>({ vad: new MyVAD() })
```

Your VAD implementation should extend the `VAD` class:

```typescript
import { VAD } from '@micdrop/client'

class MyVAD extends VAD {
  private started = false

  get isStarted(): boolean {
    return this.started
  }

  async start(stream: MediaStream, threshold?: number) {
    this.started = true

    // When speech is detected, emit StartSpeaking event
    this.emit('StartSpeaking')

    // When speech is confirmed, emit ConfirmSpeaking event
    this.emit('ConfirmSpeaking')

    // When speech is cancelled, emit CancelSpeaking event
    this.emit('CancelSpeaking')

    // When speech stops, emit StopSpeaking event
    this.emit('StopSpeaking')
  }

  async stop() {
    this.started = false
  }

  async setThreshold(threshold: number) {
    this.threshold = threshold
  }
}
```
