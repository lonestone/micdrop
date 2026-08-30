import { AudioSink, ScheduledAudio } from '@micdrop/client'
import { audioContext } from './audioContext'

/**
 * Plays samples through the Web Audio graph, on the timeline given by the
 * caller so consecutive chunks are heard without a gap.
 */
export class WebAudioSink implements AudioSink {
  public readonly output: GainNode

  constructor() {
    this.output = audioContext.createGain()
  }

  get sampleRate(): number {
    return audioContext.sampleRate
  }

  get currentTime(): number {
    return audioContext.currentTime
  }

  schedule(
    samples: Float32Array,
    when: number,
    onEnded: () => void
  ): ScheduledAudio {
    const buffer = audioContext.createBuffer(
      1,
      samples.length,
      audioContext.sampleRate
    )
    buffer.copyToChannel(samples as Float32Array<ArrayBuffer>, 0)

    const source = audioContext.createBufferSource()
    source.buffer = buffer
    source.connect(this.output)
    source.onended = onEnded
    source.start(when)

    let stopped = false
    return {
      stop() {
        if (stopped) return
        stopped = true
        source.onended = null
        try {
          source.stop()
        } catch {
          // Already finished
        }
        source.disconnect()
      },
    }
  }
}
