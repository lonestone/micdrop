import { Readable } from 'stream'
import { Logger } from '../Logger'

export abstract class TTS {
  public logger?: Logger

  abstract speak(textStream: Readable): Readable
  abstract cancel(): void

  protected log(...message: any[]) {
    this.logger?.log(...message)
  }

  destroy() {
    this.log('Destroying...')
    this.cancel()
  }
}
