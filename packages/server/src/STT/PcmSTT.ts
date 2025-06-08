import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import ffmpeg from 'fluent-ffmpeg'
import { PassThrough, Readable } from 'stream'
import { STT } from './STT'

/**
 * Abstract class for STT, converting stream to wav/pcm before transcribing
 */

export abstract class PcmSTT extends STT {
  private ffmpegInstance?: ffmpeg.FfmpegCommand
  protected sampleRate = 16000
  protected bitDepth = 16

  constructor() {
    super()

    // Setup ffmpeg
    ffmpeg.setFfmpegPath(ffmpegInstaller.path)
  }

  setStream(stream: Readable) {
    // Convert stream to WAV/PCM
    const outputStream = new PassThrough()
    this.ffmpegInstance = ffmpeg(stream)
      // .inputFormat(this.extension)
      .audioChannels(1)
      .audioFrequency(this.sampleRate)
      .audioCodec(`pcm_s${this.bitDepth}le`)
      .format(`s${this.bitDepth}le`)
    this.ffmpegInstance.pipe(outputStream)
    super.setStream(outputStream)
  }

  destroy() {
    super.destroy()
    this.ffmpegInstance?.kill('SIGINT')
    this.ffmpegInstance = undefined
  }
}
