import hark, { Harker } from 'hark'
import { VAD } from './VAD'

/**
 * Hark VAD
 * @see https://github.com/otalk/hark
 */
export class HarkVAD extends VAD {
  private hark: Harker | undefined

  get isStarted(): boolean {
    return !!this.hark
  }

  async start(stream: MediaStream, threshold?: number): Promise<void> {
    if (this.hark) return

    if (threshold !== undefined) {
      this.threshold = threshold
    }
    this.hark = hark(stream, {
      interval: this.delay,
      play: false,
      threshold: this.threshold,
    })

    this.hark.on('speaking', () => {
      this.emit('StartSpeaking')
      this.emit('ConfirmSpeaking')
    })
    this.hark.on('stopped_speaking', () => this.emit('StopSpeaking'))
  }

  async stop(): Promise<void> {
    if (!this.hark) return

    // @ts-ignore - hark types are incorrect
    this.hark.off('speaking', () => this.emit('StartSpeaking'))
    // @ts-ignore - hark types are incorrect
    this.hark.off('stopped_speaking', () => this.emit('StopSpeaking'))
    this.hark.stop()
    this.hark = undefined
  }

  async setThreshold(threshold: number): Promise<void> {
    if (threshold === this.threshold) return
    this.threshold = threshold
    this.hark?.setThreshold(threshold)
  }
}
