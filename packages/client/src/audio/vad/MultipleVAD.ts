import { getVAD, VADConfigName } from './getVAD'
import { VAD, VADStatus } from './VAD'

/**
 * Combine an array of VADs
 */
export class MultipleVAD extends VAD {
  public vads: VAD[]

  constructor(vads: Array<VAD | VADConfigName>) {
    super()
    this.vads = vads.map((vad) => getVAD(vad))
  }

  get isStarted(): boolean {
    return this.vads.some((vad) => vad.isStarted)
  }

  async start(stream: MediaStream, threshold?: number): Promise<void> {
    for (const vad of this.vads) {
      if (vad.isStarted) {
        continue
      }
      vad.on('ChangeStatus', this.onStatusChange)
      await vad.start(stream)
    }
  }

  private onStatusChange = () => {
    const isAllSilence = this.vads.every(
      (vad) => vad.status === VADStatus.Silence
    )
    const isAllSpeaking = this.vads.every(
      (vad) => vad.status === VADStatus.Speaking
    )

    // Ensure events are called in order
    switch (this.status) {
      case VADStatus.Silence:
        if (isAllSilence) break
        this.emit('StartSpeaking')
        if (isAllSpeaking) {
          this.emit('ConfirmSpeaking')
        }
        break
      case VADStatus.MaybeSpeaking:
        if (isAllSilence) {
          this.emit('CancelSpeaking')
          break
        }
        if (isAllSpeaking) {
          this.emit('ConfirmSpeaking')
        }
        break
      case VADStatus.Speaking:
        if (isAllSilence) {
          this.emit('StopSpeaking')
        }
        break
    }
  }

  async stop(): Promise<void> {
    for (const vad of this.vads) {
      vad.off('ChangeStatus', this.onStatusChange)
      await vad.stop()
    }
  }
}
