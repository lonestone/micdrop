# Voice Activity Detection (VAD)

Micdrop uses a VAD (Voice Activity Detection) to detect speech and silence and send chunks of audio to server only when speech is detected.

## Available VAD Implementations

### Volume VAD

By default, the `CallHandler` uses the `VolumeVAD` for speech detection, you can use it explicitly:

```typescript
const call = CallHandler.getInstance<YourParamsType>({ vad: 'volume' })
```

It is inspired by the [hark](https://github.com/otalk/hark) library and triggers speech detection events based on volume changes.

### Silero VAD

Alternatively, you can use the `SileroVAD` for speech detection:

```typescript
const call = CallHandler.getInstance<YourParamsType>({ vad: 'silero' })
```

It is based on the [@ricky0123/vad-web](https://github.com/ricky0123/vad) library which runs a [Silero VAD](https://github.com/snakers4/silero-vad) model in the browser using [ONNX Runtime Web](https://github.com/microsoft/onnxruntime/tree/main/js/web).

It is more accurate than the `VolumeVAD` and works better with low voice.

### Custom VAD

You can also pass your own VAD implementation:

```typescript
const call = CallHandler.getInstance<YourParamsType>({ vad: new MyVAD() })
```

Your VAD implementation should extend the `VAD` class and implement the following methods:

- `start(stream: MediaStream, threshold?: number)`: Start the VAD on the given stream
- `stop()`: Stop the VAD
- `setThreshold(threshold: number)`: Set the threshold for the VAD

It can trigger the following events:

- `StartSpeaking`: Speech starts, even it it's not confirmed
- `ConfirmSpeaking`: Speech start is confirmed
- `CancelSpeaking`: Speech is cancelled, it's just noise and can be ignored
- `StopSpeaking`: Speech stops, only if it's confirmed

See [Hark implementation](../src/audio/vad/HarkVAD.ts) as an example.

Example:

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
