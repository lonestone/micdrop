import * as fs from 'fs'
import { parseBuffer } from 'music-metadata'

export abstract class STT {
  protected chunks: ArrayBuffer[] = []

  abstract transcribe(prevMessage?: string): Promise<string | null>

  addAudio(chunk: ArrayBuffer) {
    this.chunks.push(chunk)
  }

  async saveAudio(filepath: string) {
    const blob = this.getBlob()
    fs.writeFileSync(filepath, Buffer.from(await blob.arrayBuffer()))
  }

  destroy() {
    this.chunks.length = 0
  }

  protected getBlob() {
    return new Blob(this.chunks, { type: 'audio/ogg' })
  }

  protected getFile() {
    return new File([this.getBlob()], 'audio.ogg', { type: 'audio/ogg' })
  }

  /**
   * Extracts audio metadata (encoding, sample_rate, bit_depth, channels) from the current audio buffer.
   */
  async getAudioMetadata(): Promise<{
    encoding: string | undefined
    sample_rate: number | undefined
    bit_depth: number | undefined
    channels: number | undefined
  } | null> {
    try {
      const blob = this.getBlob()
      const buffer = Buffer.from(await blob.arrayBuffer())
      const metadata = await parseBuffer(buffer, blob.type)
      return {
        encoding: metadata.format.codec,
        sample_rate: metadata.format.sampleRate,
        bit_depth: metadata.format.bitsPerSample,
        channels: metadata.format.numberOfChannels,
      }
    } catch (err) {
      // Could not extract metadata
      return null
    }
  }
}
