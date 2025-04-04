import { generateAnswer } from './generateAnswer'
import { speech2Text } from './speech2Text'
// import { text2Speech } from './text2Speech'
import { text2SpeechStream } from './text2SpeechStream'

export default {
  // LLM: Generate answer
  generateAnswer,
  // TTS: Text to speech
  // text2Speech,
  text2Speech: text2SpeechStream,
  // STT: Speech to text
  speech2Text,
}
