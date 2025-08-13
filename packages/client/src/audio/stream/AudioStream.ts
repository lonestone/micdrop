import { EventEmitter } from 'eventemitter3'
import { audioContext } from '../utils/audioContext'

export interface AudioStreamEvents {
  StartPlaying: void
  StopPlaying: void
}

export abstract class AudioStream extends EventEmitter<AudioStreamEvents> {
  public isPlaying = false
  protected outputNode: AudioNode

  constructor() {
    super()
    this.outputNode = audioContext.createGain()
  }

  abstract start(): AudioNode
  abstract playAudio(blob: Blob): Promise<void>
  abstract stopAudio(): void

  protected setIsPlaying(isPlaying: boolean) {
    if (this.isPlaying === isPlaying) return
    this.isPlaying = isPlaying
    this.emit(isPlaying ? 'StartPlaying' : 'StopPlaying')
  }
}
