import type { Mic } from './audio/Mic'
import type { Speaker } from './audio/Speaker'
import type { MicdropClient } from './client'

declare global {
  interface Window {
    micdropClient: MicdropClient
    micdropMic: Mic
    micdropSpeaker: Speaker
  }
}
