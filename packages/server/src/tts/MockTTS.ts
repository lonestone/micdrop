import * as fs from 'fs'
import { PassThrough, Readable } from 'stream'
import { TTS } from './TTS'

export class MockTTS extends TTS {
  constructor(private audioFilePaths: string[]) {
    super()
  }

  speak(textStream: Readable) {
    const audioStream = new PassThrough()
    textStream.once('data', async () => {
      for (const filePath of this.audioFilePaths) {
        await new Promise((resolve) => setTimeout(resolve, 200))
        const audioBuffer = fs.readFileSync(filePath)
        this.log(`Loaded chunk (${audioBuffer.length} bytes)`)
        audioStream.write(audioBuffer)
      }
      audioStream.end()
    })
    return audioStream
  }

  cancel() {}
}
