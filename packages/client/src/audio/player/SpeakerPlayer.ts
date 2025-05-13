import { EventEmitter } from 'eventemitter3'
import { SpeakerEvents } from '../speaker'

export abstract class SpeakerPlayer extends EventEmitter<SpeakerEvents> {
  protected audioContext: AudioContext
  protected isPlaying = false

  constructor(protected outputNode: AudioNode) {
    super()

    // Ensure we have an AudioContext from the outputNode
    const ctx = outputNode.context
    if (!(ctx instanceof AudioContext)) {
      throw new Error('OutputNode must be connected to an AudioContext')
    }
    this.audioContext = ctx
  }

  abstract setup(): Promise<void>
  abstract addBlob(blob: Blob): void
  abstract stop(): void

  destroy(): void {
    this.removeAllListeners()
  }

  protected changeIsPlaying(isPlaying: boolean) {
    if (this.isPlaying == isPlaying) return
    this.isPlaying = isPlaying
    this.emit(isPlaying ? 'StartPlaying' : 'StopPlaying')
  }
}
