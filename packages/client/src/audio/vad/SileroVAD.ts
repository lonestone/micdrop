import { MicVAD } from '@ricky0123/vad-web/src'
import { VAD } from './VAD'

/**
 * Silero VAD
 * @see https://github.com/ricky0123/vad
 */
export class SileroVAD extends VAD {
  private vad: MicVAD | undefined

  get isStarted(): boolean {
    return !!this.vad
  }

  async start(stream: MediaStream, threshold?: number): Promise<void> {
    if (this.vad) return

    if (threshold !== undefined) {
      this.threshold = threshold
    }

    const speechThreshold = Math.min(
      Math.max((this.threshold + 100) / 100, 0),
      1
    )

    this.vad = await MicVAD.new({
      stream,
      model: 'v5',
      onSpeechStart: () => this.emit('StartSpeaking'),
      onSpeechRealStart: () => this.emit('ConfirmSpeaking'),
      onVADMisfire: () => this.emit('CancelSpeaking'),
      onSpeechEnd: () => this.emit('StopSpeaking'),
      positiveSpeechThreshold: speechThreshold,
      negativeSpeechThreshold: speechThreshold * 0.7,
      minSpeechFrames: 3,
      redemptionFrames: 9,
    })

    this.vad.start()
  }

  async stop(): Promise<void> {
    if (!this.vad) return
    this.vad.destroy()
    this.vad = undefined
  }

  async setThreshold(threshold: number): Promise<void> {
    if (threshold === this.threshold) return
    // Need to recreate the VAD instance with new threshold
    if (this.vad) {
      const stream = this.vad['stream'] // Access internal stream
      await this.stop()
      await this.start(stream, threshold)
    }
  }
}
