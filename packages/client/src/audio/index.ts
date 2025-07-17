import { Mic as MicClass } from './Mic'
import { Speaker as SpeakerClass } from './Speaker'

export * from './MicRecorder'
export * from './utils/localStorage'
export * from './vad'

// Setup and export Mic instance
if (!window.micdropMic) {
  window.micdropMic = new MicClass()
}
export const Mic = window.micdropMic

// Setup and export Speaker instance
if (!window.micdropSpeaker) {
  window.micdropSpeaker = new SpeakerClass()
}
export const Speaker = window.micdropSpeaker
