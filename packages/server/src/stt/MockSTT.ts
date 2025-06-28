import { FileSTT } from '@micdrop/server'

export class MockSTT extends FileSTT {
  private i = 0

  async transcribeFile(file: File) {
    return `User Message ${this.i++}`
  }
}
