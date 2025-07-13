import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import ffmpeg from 'fluent-ffmpeg'
import { PassThrough, Readable } from 'stream'

// Setup ffmpeg
ffmpeg.setFfmpegPath(ffmpegInstaller.path)

// Convert stream to WAV/PCM
export function convertToPCM(
  audioStream: Readable,
  sampleRate = 16000,
  bitDepth = 16
) {
  const pcmStream = new PassThrough()
  ffmpeg(audioStream)
    .audioChannels(1)
    .audioFrequency(sampleRate)
    .audioCodec(`pcm_s${bitDepth}le`)
    .format(`s${bitDepth}le`)
    .pipe(pcmStream)
  return pcmStream
}

// Convert PCM stream to MP3
export function convertPCMToMp3(
  pcmStream: Readable,
  bitrate: number | string = '32k'
) {
  const mp3Stream = new PassThrough()
  ffmpeg(pcmStream)
    .inputFormat('s16le')
    .inputOptions(['-f s16le', '-ar 16000', '-ac 1'])
    .audioCodec('libmp3lame')
    .format('mp3')
    .audioBitrate(bitrate)
    .pipe(mp3Stream)
  return mp3Stream
}
