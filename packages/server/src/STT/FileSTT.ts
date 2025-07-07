import { Readable } from 'stream'
import { STT } from './STT'

/**
 * Abstract class for STT, converting stream to file before transcribing
 */

export abstract class FileSTT extends STT {
  abstract transcribeFile(file: File): Promise<string>

  transcribe(audioStream: Readable) {
    super.transcribe(audioStream)

    // Convert stream to file
    this.log('Converting stream to file...')

    const chunks: Buffer[] = []
    audioStream.on('data', (chunk) => {
      chunks.push(chunk)
    })

    audioStream.on('end', async () => {
      if (chunks.length === 0) return
      const arrayBuffer = Buffer.concat(chunks)
      const file = new File([arrayBuffer], `audio.${this.extension}`, {
        type: this.mimeType,
      })

      // Transcribe file with implementation
      this.log('Transcribing file...')
      const transcript = await this.transcribeFile(file)
      this.emit('Transcript', transcript)
    })
  }
}
