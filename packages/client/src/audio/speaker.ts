import { AudioAnalyser } from './AudioAnalyser'
import { LocalStorageKeys } from './localStorage'
import { unlock } from './unlock'

let audioElement: HTMLAudioElement | undefined
let audioContext: AudioContext | undefined
let audioBlobSourceNode: AudioBufferSourceNode | undefined

export let speakerAnalyser: AudioAnalyser | undefined

function init() {
  if (audioContext) return
  // Setup audio context
  audioContext = new (window.AudioContext ||
    (window as any).webkitAudioContext)()
  speakerAnalyser = new AudioAnalyser(audioContext)

  // Using default destination until an audio element is attached
  speakerAnalyser.node.connect(audioContext.destination)

  unlock(audioContext)
}

init()

export function canChangeSpeakerDevice(): boolean {
  return (
    window.HTMLMediaElement && 'sinkId' in window.HTMLMediaElement.prototype
  )
}

function setSinkId(speakerId?: string) {
  if (speakerId && canChangeSpeakerDevice()) {
    // @ts-ignore
    return audioElement?.setSinkId(speakerId)
  }
}

async function attachAudioElement(speakerId?: string) {
  if (!audioContext || !speakerAnalyser) return

  // Get speakerId from local storage if not provided
  if (!speakerId) {
    speakerId =
      localStorage.getItem(LocalStorageKeys.SpeakerDevice) || undefined
  }

  // Don't use audio element if no speakerId is provided
  if (!speakerId) return

  if (audioElement) {
    await setSinkId(speakerId)
    return
  }

  // Create audio element and play stream
  audioElement = new Audio()
  try {
    await setSinkId(speakerId)
    speakerAnalyser.node.disconnect(audioContext.destination)
    const destinationNode = audioContext.createMediaStreamDestination()
    speakerAnalyser.node.connect(destinationNode)
    audioElement.srcObject = destinationNode.stream
    audioElement.play()
  } catch (error) {
    console.error(`Error setting Audio Output to ${speakerId}`, error)
    audioElement = undefined
  }
}

export async function changeSpeakerDevice(speakerId: string) {
  if (!canChangeSpeakerDevice()) return
  try {
    await attachAudioElement(speakerId)
    localStorage.setItem(LocalStorageKeys.SpeakerDevice, speakerId)
  } catch (error) {
    console.error(`Error setting Audio Output to ${speakerId}`, error)
  }
}

export async function playAudioBlob(blob: Blob) {
  if (!audioContext || !speakerAnalyser) return
  try {
    await attachAudioElement()
    const sourceNode = audioContext.createBufferSource()
    audioBlobSourceNode = sourceNode
    sourceNode.onended = () => {
      sourceNode.disconnect()
      audioBlobSourceNode = undefined
    }
    sourceNode.buffer = await audioContext.decodeAudioData(
      await blob.arrayBuffer()
    )
    sourceNode.connect(speakerAnalyser.node)
    sourceNode.start()
  } catch (error) {
    console.error('Error playing audio blob', error, blob)
  }
}

export function stopAudioBlob() {
  if (!audioBlobSourceNode) return
  try {
    audioBlobSourceNode.stop()
  } catch (error) {
    console.error('Error stopping audio blob', error, audioBlobSourceNode)
  }
  audioBlobSourceNode.disconnect()
  audioBlobSourceNode = undefined
}
