import { getVAD, VADConfigName } from './getVAD'
import { VAD, VADEvents } from './VAD'

/**
 * Combine an array of VADs
 */
export class MultipleVAD extends VAD {
  public vads: VAD[]
  private startSpeakingCount = 0
  private confirmSpeakingCount = 0
  private lastEventName: keyof VADEvents = 'StopSpeaking'

  constructor(vads: Array<VAD | VADConfigName>) {
    super()
    this.vads = vads.map((vad) => getVAD(vad))
  }

  emit(eventName: keyof VADEvents, ..._: any[]) {
    this.lastEventName = eventName
    return super.emit(eventName)
  }

  get isStarted(): boolean {
    return this.vads.some((vad) => vad.isStarted)
  }

  async start(stream: MediaStream, threshold?: number): Promise<void> {
    for (const vad of this.vads) {
      if (vad.isStarted) {
        continue
      }
      vad.on('StartSpeaking', () => {
        this.startSpeakingCount++
        if (
          (this.lastEventName === 'StopSpeaking' ||
            this.lastEventName === 'CancelSpeaking') &&
          this.startSpeakingCount === this.vads.length
        ) {
          this.emit('StartSpeaking')
        }
      })
      vad.on('ConfirmSpeaking', () => {
        this.confirmSpeakingCount++
        if (
          this.lastEventName === 'StartSpeaking' &&
          this.confirmSpeakingCount === this.vads.length
        ) {
          this.emit('ConfirmSpeaking')
        }
      })
      vad.on('CancelSpeaking', () => {
        this.startSpeakingCount--
        if (this.lastEventName === 'StartSpeaking') {
          this.emit('CancelSpeaking')
        }
      })
      vad.on('StopSpeaking', () => {
        this.startSpeakingCount--
        this.confirmSpeakingCount--
        if (this.lastEventName === 'ConfirmSpeaking') {
          this.emit('StopSpeaking')
        }
      })

      await vad.start(stream)
    }
  }

  async stop(): Promise<void> {
    for (const vad of this.vads) {
      await vad.stop()
      vad.removeAllListeners()
    }
  }
}
