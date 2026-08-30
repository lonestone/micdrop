import { AudioSink, ScheduledAudio } from '@micdrop/client'
import { AudioContext, GainNode } from 'react-native-audio-api'
import { getAudioContext } from './context'

/**
 * Plays samples through the native audio graph, on the timeline given by the
 * caller so consecutive chunks are heard without a gap.
 */
export class NativeSink implements AudioSink {
  private context: AudioContext
  public readonly output: GainNode

  constructor() {
    this.context = getAudioContext()
    this.output = this.context.createGain()
    this.output.connect(this.context.destination)
  }

  get sampleRate(): number {
    return this.context.sampleRate
  }

  get currentTime(): number {
    return this.context.currentTime
  }

  schedule(
    samples: Float32Array,
    when: number,
    onEnded: () => void
  ): ScheduledAudio {
    // A view on a bigger buffer would hand the native side more than these
    // samples, so give it a buffer holding exactly them
    const isStandalone =
      samples.byteOffset === 0 &&
      samples.byteLength === samples.buffer.byteLength
    const data = (
      isStandalone ? samples : new Float32Array(samples)
    ) as Float32Array<ArrayBuffer>

    const buffer = this.context.createBuffer(
      1,
      data.length,
      this.context.sampleRate
    )
    buffer.copyToChannel(data, 0)

    const source = this.context.createBufferSource()
    source.buffer = buffer
    source.connect(this.output)
    source.onEnded = onEnded
    source.start(when)

    let stopped = false
    return {
      stop() {
        if (stopped) return
        stopped = true
        source.onEnded = null
        try {
          source.stop()
        } catch {
          // Already finished
        }
        source.disconnect()
      },
    }
  }

  close() {
    this.output.disconnect()
  }
}
