import * as dotenv from 'dotenv'
dotenv.config()

import { GladiaSTT } from '@micdrop/gladia'
import { Logger } from '@micdrop/server'
import { PassThrough } from 'stream'
import { streamAudioChunks } from './utils/streamAudioChunks'

const stt = new GladiaSTT({
  apiKey: process.env.GLADIA_API_KEY || '',
})
stt.logger = new Logger('GladiaSTT')

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
