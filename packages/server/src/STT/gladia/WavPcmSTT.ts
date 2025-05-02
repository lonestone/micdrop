import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import ffmpeg from 'fluent-ffmpeg'
import { PassThrough } from 'stream'
import { STT } from '../STT'

/**
 * Abstract class for STT, converting received chunks to wav/pcm
 */

export abstract class WavPcmSTT extends STT {
  private inputStream?: PassThrough
  private ffmpegInstance?: ffmpeg.FfmpegCommand
  protected sampleRate = 16000
  protected bitDepth = 16

  constructor() {
    super()

    // Setup ffmpeg
    ffmpeg.setFfmpegPath(ffmpegInstaller.path)
  }

  abstract onWavPcmChunk(chunk: ArrayBuffer): Promise<void>

  private startWavPCMConversion() {
    this.inputStream = new PassThrough()
    const outputStream = new PassThrough()
    this.ffmpegInstance = ffmpeg(this.inputStream)
      .inputFormat(this.extension)
      .audioChannels(1)
      .audioFrequency(this.sampleRate)
      .audioCodec(`pcm_s${this.bitDepth}le`)
      .format('s16le')
      .on('error', (error) => {
        if (this.ffmpegInstance) {
          console.error('[WavPcmSTT] Error converting audio to WAV/PCM', error)
          this.stopWavPCMConversion()
        }
      })
      .on('end', () => {
        console.log('[WavPcmSTT] Audio converted to WAV/PCM (end)')
      })
    this.ffmpegInstance.pipe(outputStream)
    outputStream.on('data', (data: ArrayBuffer) => {
      this.onWavPcmChunk(data)
      console.log(`[WavPcmSTT] Audio chunk (${data.byteLength} bytes)`)
    })
  }

  private stopWavPCMConversion() {
    if (this.inputStream) {
      this.inputStream.destroy()
      this.inputStream = undefined
    }
    if (this.ffmpegInstance) {
      this.ffmpegInstance.kill('SIGINT')
      this.ffmpegInstance = undefined
    }
  }

  async addChunk(chunk: ArrayBuffer) {
    super.addChunk(chunk)
    console.log('[WavPcmSTT] Adding audio...')

    // Convert chunk to WAV/PCM using ffmpeg
    if (!this.inputStream) {
      this.startWavPCMConversion()
    }
    this.inputStream?.write(chunk)
  }

  destroy() {
    super.destroy()
    this.stopWavPCMConversion()
  }
}
