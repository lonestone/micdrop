import { Readable } from 'stream'
import { STT } from './STT'

/**
 * Abstract class for STT, converting stream to file before transcribing
 */

export abstract class FileSTT extends STT {
  abstract transcribe(file: File): Promise<string>

  setStream(stream: Readable) {
    super.setStream(stream)

    const chunks: Buffer[] = []
    stream.on('data', (chunk) => {
      chunks.push(chunk)
    })

    stream.on('end', async () => {
      if (chunks.length === 0) return
      const arrayBuffer = Buffer.concat(chunks)
      const file = new File([arrayBuffer], `audio.${this.extension}`, {
        type: this.mimeType,
      })
      const transcript = await this.transcribe(file)
      this.onTranscript?.(transcript)
    })
  }
}
