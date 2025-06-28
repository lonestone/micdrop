import { Readable } from 'stream'
import { Logger } from '../Logger'
import { MicdropServer } from '../MicdropServer'

export abstract class Agent extends Logger {
  // Used for context
  public call?: MicdropServer

  abstract answer(text: string): Readable
  abstract cancel(): void

  destroy() {
    this.log('Destroying...')
    this.call = undefined
  }
}
