import { Duplex } from 'stream'
import { Agent } from './Agent'

export class MockAgent extends Agent {
  private i = 0

  answer(text: string) {
    const stream = new Duplex()
    stream.write(`Assistant Message ${this.i++}`)
    stream.end()
    return stream
  }

  cancel() {
    // Do nothing
  }
}
