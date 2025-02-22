import { generateAnswer } from './generateAnswer'
import { speech2Text } from './speech2Text'
import { text2Speech } from './text2Speech'

export default {
  // LLM: Generate answer
  generateAnswer,
  // TTS: Text to speech
  text2Speech,
  // STT: Speech to text
  speech2Text,
}
