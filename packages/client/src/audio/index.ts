import { MicController } from './Mic'
import { SpeakerController } from './Speaker'

export * from './Mic'
export * from './MicRecorder'
export * from './Pcm16AudioStream'
export * from './pcm'
export * from './Speaker'
export * from './types'
export * from './vad'
export * from './volume'

const globalScope = globalThis as typeof globalThis & {
  micdropMic?: MicController
  micdropSpeaker?: SpeakerController
}

// One microphone and one speaker for the whole app, kept across fast refreshes
// and shared even if two copies of the package end up in the same bundle
if (!globalScope.micdropMic) {
  globalScope.micdropMic = new MicController()
}
if (!globalScope.micdropSpeaker) {
  globalScope.micdropSpeaker = new SpeakerController()
}

export const Mic = globalScope.micdropMic
export const Speaker = globalScope.micdropSpeaker
