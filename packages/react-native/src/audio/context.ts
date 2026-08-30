import { AudioContext } from 'react-native-audio-api'

let context: AudioContext | undefined

/**
 * The audio graph shared by the microphone and the speaker.
 *
 * It is created on the first call rather than at import time: building it
 * claims the audio session, which should only happen once the app really wants
 * to record or play something.
 */
export function getAudioContext(): AudioContext {
  if (!context) {
    context = new AudioContext()
  }
  return context
}
