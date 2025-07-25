import EventEmitter from 'eventemitter3'
import { Readable } from 'stream'
import { Logger } from '../Logger'

// Audio mime type to extension map
const MIME_TYPE_TO_EXTENSION = {
  'audio/wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/mpeg': 'mp3',
  'audio/webm': 'webm',
  'audio/mp4': 'mp4',
  'audio/flac': 'flac',
} as const

export interface STTEvents {
  Transcript: [string]
}

export abstract class STT extends EventEmitter<STTEvents> {
  protected mimeType?: keyof typeof MIME_TYPE_TO_EXTENSION
  public logger?: Logger

  // Set stream of audio to transcribe
  transcribe(audioStream: Readable) {
    // Detect mime type at first chunk
    audioStream.once('data', (chunk) => {
      this.mimeType = this.detectMimeType(chunk)
    })
  }

  protected log(...message: any[]) {
    this.logger?.log(...message)
  }

  destroy() {
    this.log('Destroyed')
    this.removeAllListeners()
  }

  protected get extension(): string {
    return (this.mimeType && MIME_TYPE_TO_EXTENSION[this.mimeType]) || 'bin'
  }

  private detectMimeType(
    chunk: ArrayBuffer
  ): keyof typeof MIME_TYPE_TO_EXTENSION {
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
    this.log('Unable to detect mime type, using default', chunk)
    return 'audio/wav'
  }
}
