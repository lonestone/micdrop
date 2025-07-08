import * as fs from 'fs'
import { PassThrough, Readable } from 'stream'
import { TTS } from './TTS'

export class MockTTS extends TTS {
  private sampleBuffer: Buffer

  constructor(sampleFilePathOrBuffer: string | Buffer) {
    super()
    if (typeof sampleFilePathOrBuffer === 'string') {
      this.sampleBuffer = fs.readFileSync(sampleFilePathOrBuffer)
    } else {
      this.sampleBuffer = sampleFilePathOrBuffer
    }
  }

  speak(textStream: Readable) {
    const audioStream = new PassThrough()
    textStream.once('data', (chunk) => {
      audioStream.write(this.sampleBuffer)
    })
    textStream.on('end', () => {
      audioStream.end()
    })
    return audioStream
  }

  cancel() {}
}
