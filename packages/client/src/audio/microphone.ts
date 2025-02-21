import { AudioAnalyser } from './AudioAnalyser'
import { LocalStorageKeys } from './localStorage'
import { stopStream } from './stopStream'

let currentDeviceId: string | undefined
let audioStream: MediaStream | undefined
let audioContext: AudioContext | undefined
let sourceNode: MediaStreamAudioSourceNode | undefined

export let micAnalyser: AudioAnalyser | undefined
export const defaultMicThreshold = -50 // in dB

function init() {
  if (audioContext) return

  // Setup audio context
  audioContext = new (window.AudioContext ||
    (window as any).webkitAudioContext)()
  micAnalyser = new AudioAnalyser(audioContext)
}

init()

// Resume AudioContext on click, see https://developers.google.com/web/updates/2017/09/autoplay-policy-changes
document.addEventListener('click', () => {
  if (audioContext?.state === 'suspended') {
    audioContext?.resume()
  }
})

// eslint-disable-next-line
export function getMicConstraints(deviceId?: string): MediaStreamConstraints {
  return {
    audio: {
      deviceId: { ideal: deviceId },
      sampleRate: 16000, // not working, it will follow device settings, usually 44.1kHz
      sampleSize: 16,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
    },
  }
}

export async function startMicrophone(deviceId?: string): Promise<MediaStream> {
  if (!audioContext || !micAnalyser) {
    throw new Error('AudioContext not initialized')
  }

  // Get deviceId from localStorage
  if (!deviceId) {
    deviceId = localStorage.getItem(LocalStorageKeys.MicDevice) || undefined
  }

  if (audioStream) {
    // deviceId has not changed, reuse previous stream
    if (currentDeviceId === deviceId) {
      return audioStream
    }

    // deviceId has changed, stop previous stream
    stopStream(audioStream)
  }

  // Get stream from microphone
  audioStream = await navigator.mediaDevices.getUserMedia(
    getMicConstraints(deviceId)
  )

  // Store deviceId
  const track = audioStream.getTracks()[0]
  const newDeviceId =
    track && track.getCapabilities && track.getCapabilities().deviceId
  if (newDeviceId) {
    localStorage.setItem(LocalStorageKeys.MicDevice, newDeviceId)
    currentDeviceId = newDeviceId
  } else {
    localStorage.removeItem(LocalStorageKeys.MicDevice)
    currentDeviceId = undefined
  }

  // Connect to AudioContext
  if (sourceNode) sourceNode.disconnect()
  sourceNode = audioContext.createMediaStreamSource(audioStream)
  sourceNode.connect(micAnalyser.node)

  return audioStream
}

export function stopMicrophone() {
  if (sourceNode) {
    sourceNode.disconnect()
    sourceNode = undefined
  }
  if (audioStream) {
    stopStream(audioStream)
    audioStream = undefined
  }
}

export function createDelayedStream(stream: MediaStream): MediaStream {
  if (!audioContext) {
    throw new Error('AudioContext not initialized')
  }
  const audioSource = audioContext.createMediaStreamSource(stream)
  const delayNode = audioContext.createDelay()
  delayNode.delayTime.value = 0.3
  const audioDestination = audioContext.createMediaStreamDestination()
  audioSource.connect(delayNode)
  delayNode.connect(audioDestination)
  return audioDestination.stream
}
