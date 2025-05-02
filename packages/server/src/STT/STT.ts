import * as fs from 'fs'


// Audio mime type to extension map
const MIME_TYPE_TO_EXTENSION = {
  'audio/wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/mpeg': 'mp3',
  'audio/webm': 'webm',
  'audio/mp4': 'mp4',
  'audio/flac': 'flac',
} as const

export abstract class STT {
  protected chunks: ArrayBuffer[] = []
  private detectedMimeType?: keyof typeof MIME_TYPE_TO_EXTENSION

  abstract transcribe(prevMessage?: string): Promise<string | null>

  addChunk(chunk: ArrayBuffer) {
    this.chunks.push(chunk)
  }

  resetChunks() {
    this.chunks.length = 0
  }

  async saveAudio(filepath: string) {
    if (this.chunks.length === 0) {
      console.warn('No chunks to save, skipping...')
      return
    }
    const blob = this.getBlob()
    fs.writeFileSync(`${filepath}.${this.extension}`, Buffer.from(await blob.arrayBuffer()))
  }

  destroy() {
    this.chunks.length = 0
    this.detectedMimeType = undefined
  }

  protected get mimeType(): keyof typeof MIME_TYPE_TO_EXTENSION {
    if (!this.detectedMimeType) {
      this.detectedMimeType = this.detectMimeType(this.chunks[0])
    }
    return this.detectedMimeType
  }

  protected get extension(): string {
    return MIME_TYPE_TO_EXTENSION[this.mimeType] || 'bin'
  }

  protected getBlob() {
    return new Blob(this.chunks, { type: this.mimeType })
  }

  protected getFile() {
    const blob = this.getBlob()
    return new File([blob], `audio.${this.extension}`, { type: blob.type })
  }

  private detectMimeType(chunk: ArrayBuffer | undefined): keyof typeof MIME_TYPE_TO_EXTENSION {
    if (!chunk || chunk.byteLength === 0) {
      throw new Error('Unable to detect mime type (empty chunk)')
    }

    const arr = new Uint8Array(chunk)

    // WEBM: 1A 45 DF A3
    if (
      arr[0] === 0x1a &&
      arr[1] === 0x45 &&
      arr[2] === 0xdf &&
      arr[3] === 0xa3
    ) {
      return 'audio/webm'
    }
    // OGG: 4F 67 67 53
    if (
      arr[0] === 0x4f &&
      arr[1] === 0x67 &&
      arr[2] === 0x67 &&
      arr[3] === 0x53
    ) {
      return 'audio/ogg'
    }
    // WAV: 52 49 46 46 ... 57 41 56 45
    if (
      arr[0] === 0x52 &&
      arr[1] === 0x49 &&
      arr[2] === 0x46 &&
      arr[3] === 0x46 &&
      arr[8] === 0x57 &&
      arr[9] === 0x41 &&
      arr[10] === 0x56 &&
      arr[11] === 0x45
    ) {
      return 'audio/wav'
    }
    // MP3: 49 44 33
    if (arr[0] === 0x49 && arr[1] === 0x44 && arr[2] === 0x33) {
      return 'audio/mpeg'
    }
    // MP4/M4A: 00 00 00 .. 66 74 79 70
    if (
      arr[4] === 0x66 &&
      arr[5] === 0x74 &&
      arr[6] === 0x79 &&
      arr[7] === 0x70
    ) {
      return 'audio/mp4'
    }
    // FLAC: 66 4c 61 43
    if (
      arr[0] === 0x66 &&
      arr[1] === 0x4c &&
      arr[2] === 0x61 &&
      arr[3] === 0x43
    ) {
      return 'audio/flac'
    }
    console.warn('Unable to detect mime type, using default')
    return 'audio/wav'
  }
}
