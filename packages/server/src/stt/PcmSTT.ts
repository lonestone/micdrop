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

  abstract transcribePCM(stream: Readable): void

  transcribe(audioStream: Readable) {
    this.log('Converting stream to WAV/PCM...')

    // Convert stream to WAV/PCM
    const pcmStream = new PassThrough()
    pcmStream.on('error', (error) => {
      this.log('Error converting to WAV/PCM', error)
    })
    this.ffmpegInstance = ffmpeg(audioStream)
      // .inputFormat(this.extension)
      .audioChannels(1)
      .audioFrequency(this.sampleRate)
      .audioCodec(`pcm_s${this.bitDepth}le`)
      .format(`s${this.bitDepth}le`)
      .on('error', (error) => {
        this.log('Error converting to WAV/PCM', error)
      })
    this.ffmpegInstance.pipe(pcmStream)

    // Pass new stream to implementation
    this.log('Transcribing WAV/PCM stream...')
    this.transcribePCM(pcmStream)
  }

  destroy() {
    super.destroy()
    this.ffmpegInstance?.kill('SIGINT')
    this.ffmpegInstance = undefined
  }
}
