import { CallConfig } from '@micdrop/server'
import { text2Speech } from './elevenlabs/text2Speech'
import { generateAnswer } from './openai/generateAnswer'
import { speech2Text } from './openai/speech2Text'

export default {
  // LLM: Generate answer
  generateAnswer,
  // TTS: Text to speech
  text2Speech,
  // STT: Speech to text
  speech2Text,
} satisfies Partial<CallConfig>
