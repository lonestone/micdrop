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
    .on('error', (error) => {
      console.error('Error converting audio stream:', error.message)
    })
    .pipe(pcmStream)
  return pcmStream
}

// Convert PCM stream to WebM/Opus
export function convertToOpus(audioStream: Readable, sampleRate = 16000) {
  const webmStream = new PassThrough()
  ffmpegToOpus(ffmpeg(audioStream), sampleRate).pipe(webmStream)
  return webmStream
}

// Convert PCM stream to WebM/Opus
export function convertPCMToOpus(audioStream: Readable, sampleRate = 16000) {
  const webmStream = new PassThrough()
  ffmpegToOpus(ffmpeg(audioStream), sampleRate)
    .inputFormat('s16le')
    .inputOptions(['-f s16le', '-ar 16000', '-ac 1'])
    .pipe(webmStream)
  return webmStream
}

function ffmpegToOpus(ffmpegCommand: ffmpeg.FfmpegCommand, sampleRate = 16000) {
  return ffmpegCommand
    .audioChannels(1)
    .audioFrequency(sampleRate)
    .audioCodec('libopus')
    .format('webm')
    .outputOptions([
      '-application audio',
      `-ac 1`,
      `-ar ${sampleRate}`,
      `-b:a 64k`,
      `-f webm`,
      `-map_metadata -1`,
    ])
    .on('error', (error) => {
      console.error('Error converting to Opus: ', error.message)
    })
}
