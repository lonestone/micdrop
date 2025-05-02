import { STT } from './STT'

export class MockSTT extends STT {
  private i = 0

  async transcribe(prevMessage?: string) {
    return `User Message ${this.i++}`
  }
}
