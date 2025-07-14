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
    .on('error', (error) => {
      console.error('Error converting PCM to MP3:', error.message)
    })
    .pipe(mp3Stream)
  return mp3Stream
}

// Convert PCM stream to WebM/Opus
export function convertPCMToOpus(audioStream: Readable, sampleRate = 48000) {
  const webmStream = new PassThrough()
  ffmpeg(audioStream)
    .inputFormat('s16le')
    .inputOptions(['-f s16le', '-ar 16000', '-ac 1'])
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
    .pipe(webmStream)
  return webmStream
}

// Convert PCM stream to WebM/Opus
export function convertToOpus(audioStream: Readable, sampleRate = 48000) {
  const webmStream = new PassThrough()
  ffmpeg(audioStream)
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
    .pipe(webmStream)
  return webmStream
}
