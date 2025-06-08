import { FileSTT } from '../FileSTT'

export class MockSTT extends FileSTT {
  private i = 0

  async transcribe(file: File) {
    return `User Message ${this.i++}`
  }
}
