import { AudioAnalyser } from './utils/AudioAnalyser'
import { audioContext } from './utils/audioContext'
import { LocalStorageKeys } from './utils/localStorage'
import { stopStream } from './utils/stopStream'

let currentDeviceId: string | undefined
let audioStream: MediaStream | undefined
let sourceNode: MediaStreamAudioSourceNode | undefined

export const micAnalyser = new AudioAnalyser(audioContext)
export const defaultMicThreshold = -50 // in dB

function getMicConstraints(deviceId?: string): MediaStreamConstraints {
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

/**
 * Starts the microphone
 * @param deviceId - The deviceId to use
 * @returns The microphone stream
 */
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

/**
 * Stops the microphone
 */
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
