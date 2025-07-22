import { PassThrough } from 'stream'
import { Agent } from './Agent'

export class MockAgent extends Agent {
  private i = 0

  constructor() {
    super({ systemPrompt: '' })
  }

  answer() {
    const stream = new PassThrough()
    const textPromise = this.createTextPromise()

    // Answer message
    const message = `Assistant Message ${this.i++}`
    this.addAssistantMessage(message)
    stream.write(message)
    stream.end()
    textPromise.resolve(message)
    return { text: textPromise.promise, stream }
  }

  cancel() {}
}
