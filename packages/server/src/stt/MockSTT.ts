import { STT } from './STT'

export class MockSTT extends STT {
  private i = 0

  async transcribe() {
    setTimeout(() => {
      this.emit('Transcript', `User Message ${this.i++}`)
    }, 300)
  }
}
