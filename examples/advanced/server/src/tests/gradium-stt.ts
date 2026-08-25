import * as dotenv from 'dotenv'
dotenv.config()

import { GradiumSTT } from '@micdrop/gradium'
import { Logger } from '@micdrop/server'
import { PassThrough } from 'stream'
import { streamAudioChunks } from './utils/streamAudioChunks'

const stt = new GradiumSTT({
  apiKey: process.env.GRADIUM_API_KEY || '',
})
stt.logger = new Logger('GradiumSTT')

// Create audio stream from chunk files
const audioStream = new PassThrough()

// Start transcription
stt.transcribe(audioStream)

// Start streaming chunks
streamAudioChunks(audioStream)

// Listen for transcription events
stt.on('Transcript', (transcript) => {
  console.log('Transcription received:', transcript)
  stt.destroy()
})
