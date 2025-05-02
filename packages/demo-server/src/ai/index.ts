import { CallConfig, GladiaSTT } from '@micdrop/server'
import { text2Speech } from './elevenlabs/text2Speech'
import { generateAnswer } from './openai/generateAnswer'

export default {
  // LLM: Generate answer
  generateAnswer,
  // TTS: Text to speech
  text2Speech,
  // STT: Speech to text
  speech2Text: new GladiaSTT({
    apiKey: process.env.GLADIA_API_KEY || '',
  }),
  // speech2Text: new OpenaiSTT({
  //   apiKey: process.env.OPENAI_API_KEY || '',
  // }),
} satisfies Partial<CallConfig>
