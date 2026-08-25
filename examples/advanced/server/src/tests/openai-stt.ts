import * as dotenv from 'dotenv'
dotenv.config()

import { OpenaiSTT } from '@micdrop/openai'
import { Logger } from '@micdrop/server'
import { PassThrough } from 'stream'
import { streamAudioChunks } from './utils/streamAudioChunks'

const stt = new OpenaiSTT({
  apiKey: process.env.OPENAI_API_KEY || '',
})
stt.logger = new Logger('OpenaiSTT')

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
