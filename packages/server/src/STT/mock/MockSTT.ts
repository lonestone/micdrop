import { STT } from '../STT'

export class MockSTT extends STT {
  private i = 0

  async transcribe(prevMessage?: string) {
    this.resetChunks()
    return `User Message ${this.i++}`
  }
}
