import { EventEmitter } from 'eventemitter3'
import { Readable } from 'stream'
import { Logger } from '../Logger'

export interface STTEvents {
  Transcript: [string]
}

export abstract class STT extends EventEmitter<STTEvents> {
  public logger?: Logger

  // Set stream of audio to transcribe
  abstract transcribe(audioStream: Readable): void

  protected log(...message: any[]) {
    this.logger?.log(...message)
  }

  destroy() {
    this.log('Destroyed')
    this.removeAllListeners()
  }
}
