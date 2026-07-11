import * as dotenv from 'dotenv'
dotenv.config()

import { MistralSTT } from '@micdrop/mistral'
import { Logger } from '@micdrop/server'
import { PassThrough } from 'stream'
import { streamAudioChunks } from './utils/streamAudioChunks'

const stt = new MistralSTT({
  apiKey: process.env.MISTRAL_API_KEY || '',
})
stt.logger = new Logger('MistralSTT')

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
