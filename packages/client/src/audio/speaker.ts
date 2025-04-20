import { SpeakerConcatPlayer } from './player/SpeakerConcatPlayer'
import { SpeakerMediaSourcePlayer } from './player/SpeakerMediaSourcePlayer'
import { SpeakerPlayer } from './player/SpeakerPlayer'
import { SpeakerSequencePlayer } from './player/SpeakerSequencePlayer'
import { AudioAnalyser } from './utils/AudioAnalyser'
import { audioContext } from './utils/audioContext'
import { LocalStorageKeys } from './utils/localStorage'
import { unlock } from './utils/unlock'

let audioElement: HTMLAudioElement | undefined
let player: SpeakerPlayer | undefined
let streamingEnabled = false

export const speakerAnalyser = new AudioAnalyser(audioContext)

async function init() {
  unlock(audioContext)

  // Create audio element if it doesn't exist
  audioElement = new Audio()
  audioElement.autoplay = true

  // Select speaker device if speakerId is in local storage
  const speakerId = localStorage.getItem(LocalStorageKeys.SpeakerDevice)
  if (speakerId) {
    try {
      await setSinkId(speakerId)
    } catch (error) {
      console.error('Failed to set sink ID:', error)
    }
  }

  // Source -> Analyser
  await setupSpeakerPlayer()

  // Analyser -> Destination
  const destinationNode = audioContext.createMediaStreamDestination()
  speakerAnalyser.node.connect(destinationNode)

  // Destination -> Speaker
  audioElement.srcObject = destinationNode.stream
}

init()

async function setupSpeakerPlayer() {
  try {
    player?.destroy()
    player = streamingEnabled
      ? SpeakerMediaSourcePlayer.isCompatible
        ? new SpeakerMediaSourcePlayer(speakerAnalyser.node)
        : new SpeakerConcatPlayer(speakerAnalyser.node)
      : new SpeakerSequencePlayer(speakerAnalyser.node)
    await player?.setup()
  } catch (error) {
    console.error('Error setting up speaker player', error)
  }
}

export async function isStreamingEnabled() {
  return streamingEnabled
}

export async function enableStreaming() {
  if (streamingEnabled) return
  streamingEnabled = true
  await setupSpeakerPlayer()
}

export async function disableStreaming() {
  if (!streamingEnabled) return
  streamingEnabled = false
  await setupSpeakerPlayer()
}

/**
 * Checks if the speaker device can be changed
 * @returns True if the speaker device can be changed, false otherwise
 */
export function canChangeSpeakerDevice(): boolean {
  return (
    window.HTMLMediaElement && 'sinkId' in window.HTMLMediaElement.prototype
  )
}

async function setSinkId(speakerId?: string) {
  if (speakerId && canChangeSpeakerDevice() && audioElement) {
    // @ts-ignore
    return audioElement.setSinkId(speakerId)
  }
}

/**
 * Changes the speaker device
 * @param speakerId - The speakerId to use
 */
export async function changeSpeakerDevice(speakerId: string) {
  if (!canChangeSpeakerDevice()) return
  try {
    await setSinkId(speakerId)
    localStorage.setItem(LocalStorageKeys.SpeakerDevice, speakerId)
  } catch (error) {
    console.error(`Error setting Audio Output to ${speakerId}`, error)
  }
}

/**
 * Pauses the audio
 */
export function pauseAudio() {
  if (audioElement) {
    audioElement.pause()
  }
}

/**
 * Resumes the audio
 */
export function resumeAudio() {
  if (audioElement) {
    audioElement.play()
  }
}

/**
 * Plays the audio
 * @param blob - The blob to play (adds to the queue if already playing)
 */
export async function playAudio(blob: Blob) {
  if (!audioElement || !player) return
  try {
    // Add blob to stream
    player.addBlob(blob)

    // Start playing if not already playing
    if (audioElement.paused) {
      audioElement.play()
    }
  } catch (error) {
    console.error('Error playing audio blob', error, blob)
  }
}

/**
 * Stops the audio
 */
export function stopAudio() {
  audioElement?.pause()
  player?.stop()
}
