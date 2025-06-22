import { Readable } from 'stream'
import { Logger } from '../Logger'
import { MicdropServer } from '../MicdropServer'

export abstract class TTS extends Logger {
  // May be used for context
  public call?: MicdropServer

  abstract speech(textStream: Readable): Readable
  abstract cancel(): void

  destroy() {
    this.log('Destroying...')
    this.call = undefined
  }
}
