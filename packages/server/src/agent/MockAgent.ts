import { PassThrough } from 'stream'
import { Agent } from './Agent'

export class MockAgent extends Agent {
  private i = 0

  constructor() {
    super({ systemPrompt: '' })
  }

  answer() {
    const answer = `Assistant Message ${this.i++}`
    this.addAssistantMessage(answer)
    const stream = new PassThrough()
    stream.write(answer)
    stream.end()
    return stream
  }

  cancel() {}
}
