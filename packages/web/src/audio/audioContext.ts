import { unlock } from './unlock'

export let audioContext: AudioContext

export function createAudioContext() {
  return new (window.AudioContext || (window as any).webkitAudioContext)()
}

declare global {
  interface Window {
    micdropAudioContext: AudioContext
  }
}

if (window.micdropAudioContext) {
  audioContext = window.micdropAudioContext
} else {
  window.micdropAudioContext = audioContext = createAudioContext()

  // Hack to unlock audio context on some browsers
  unlock(audioContext)
}
