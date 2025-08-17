import { PassThrough } from 'stream'
import { Agent } from './Agent'

export class MockAgent extends Agent {
  private i = 0

  constructor() {
    super({ systemPrompt: '' })
  }

  protected async generateAnswer(stream: PassThrough): Promise<void> {
    const message = `Assistant Message ${this.i++}`
    this.addAssistantMessage(message)
    stream.write(message)
  }

  cancel() {}
}
