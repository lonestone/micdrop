# Voice Activity Detection (VAD)

Micdrop uses a VAD (Voice Activity Detection) to detect speech and silence and send chunks of audio to the server only when speech is detected.

## Supported VAD Types

Micdrop supports the following VADs by name:

- `'volume'`: Volume-based VAD (default)
- `'silero'`: AI-based VAD using Silero

You can also pass instances of these VADs, or combine them in an array. See below for details.

> **Note:** Only `'volume'` and `'silero'` are supported as string names. Custom VADs must be passed as instances.

## Volume VAD: Speech detection based on volume

By default, the `MicdropClient` uses the `VolumeVAD` for speech detection. You can use it explicitly:

```typescript
const call = MicdropClient.getInstance<YourParamsType>({ vad: 'volume' })
```

It is inspired by the [hark](https://github.com/otalk/hark) library and triggers speech detection events based on volume changes.

You can also pass an instance of the `VolumeVAD` to the `MicdropClient`:

```typescript
const vad = new VolumeVAD({
  history: 5, // Number of frames to consider for volume calculation
  threshold: -55, // Threshold in decibels for speech detection
})
const call = MicdropClient.getInstance<YourParamsType>({ vad })
```

- **Default options:** `{ history: 5, threshold: -55 }`
- **Persistence:** Options are saved to `localStorage` and restored automatically.

## Silero VAD: Human speech detection with AI

To use the `SileroVAD` for speech detection:

```typescript
const call = MicdropClient.getInstance<YourParamsType>({ vad: 'silero' })
```

It is based on the [@ricky0123/vad-web](https://github.com/ricky0123/vad) library which runs a [Silero VAD](https://github.com/snakers4/silero-vad) model in the browser using [ONNX Runtime Web](https://github.com/microsoft/onnxruntime/tree/main/js/web).

It is more accurate than the `VolumeVAD` and works better with low voice.

You can also pass an instance of the `SileroVAD` to the `MicdropClient`:

```typescript
const vad = new SileroVAD({
  positiveSpeechThreshold: 0.18, // Threshold for positive speech detection
  negativeSpeechThreshold: 0.11, // Threshold for negative speech detection
  minSpeechFrames: 8, // Minimum number of frames to consider for speech detection
  redemptionFrames: 20, // Number of frames to consider for silence detection
})
const call = MicdropClient.getInstance<YourParamsType>({ vad })
```

- **Default options:** `{ positiveSpeechThreshold: 0.18, negativeSpeechThreshold: 0.11, minSpeechFrames: 8, redemptionFrames: 20 }`
- **Persistence:** Options are saved to `localStorage` and restored automatically.

## Multiple VAD: Combine multiple VADs

Combining multiple VADs is useful to get more accurate speech detection:

- Volume to ignore low voice
- Silero to detect human speech

You can combine multiple VADs by passing an array of VAD names:

```typescript
const call = MicdropClient.getInstance<YourParamsType>({
  vad: ['volume', 'silero'],
})
```

Or with instances:

```typescript
const vad = [new VolumeVAD(), new SileroVAD()]
const call = MicdropClient.getInstance<YourParamsType>({ vad })
```

Or mix names and instances.

**How it works:**

- `StartSpeaking` is emitted when any VAD detects possible speech.
- `ConfirmSpeaking` is emitted only when _all_ VADs confirm speech.
- `StopSpeaking` is emitted when _all_ VADs detect silence.
- `CancelSpeaking` is emitted if all VADs agree speech was a false positive.

## Custom VAD

You can also pass your own VAD implementation:

```typescript
const call = MicdropClient.getInstance<YourParamsType>({ vad: new MyVAD() })
```

Your VAD implementation should extend the `VAD` class:

```typescript
import { VAD } from '@micdrop/client'

class MyVAD extends VAD {
  private started = false

  get isStarted(): boolean {
    return this.started
  }

  async start(stream: MediaStream) {
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
}
```

> **Tip:** See the codebase for `HarkVAD` (`src/audio/vad/HarkVAD.ts`) as another example of a custom VAD. It is not exported by default, as `VolumeVAD` is the recommended and supported option inspired by Hark.

## VAD Events

VADs emit the following events:

- `StartSpeaking`: Possible speech detected (not yet confirmed)
- `ConfirmSpeaking`: Speech confirmed
- `CancelSpeaking`: Speech start was a false positive (noise, etc.)
- `StopSpeaking`: Speech ended
- `ChangeStatus`: Status changed (`Silence`, `MaybeSpeaking`, `Speaking`)

## VAD Delay

All VADs have a `delay` property (default: 100ms) that controls the interval for speech detection checks. You can adjust this in custom VADs if needed.
