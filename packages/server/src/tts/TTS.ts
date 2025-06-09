import { Readable } from 'stream'
import { CallServer } from '../CallServer'
import { Logger } from '../Logger'

export abstract class TTS extends Logger {
  // May be used for context
  public call?: CallServer

  abstract speech(textStream: Readable): Readable
  abstract cancel(): void

  destroy() {
    this.log('Destroying...')
    this.call = undefined
  }
}
