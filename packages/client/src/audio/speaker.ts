import { AudioAnalyser } from './AudioAnalyser'
import { LocalStorageKeys } from './localStorage'
import { unlock } from './unlock'

let audioElement: HTMLAudioElement | undefined
let audioContext: AudioContext | undefined
let mediaSource: MediaSource | undefined
let sourceBuffer: SourceBuffer | undefined
let currentMediaStream: MediaStream | undefined
let isProcessingQueue = false
const pendingBlobs: Blob[] = []

export let speakerAnalyser: AudioAnalyser | undefined

function init() {
  if (audioContext) return
  // Setup audio context
  audioContext = new (window.AudioContext ||
    (window as any).webkitAudioContext)()
  speakerAnalyser = new AudioAnalyser(audioContext)
  unlock(audioContext)
}

init()

async function setupAudioElement(speakerId?: string) {
  if (!audioContext || !speakerAnalyser) return

  // Get speakerId from local storage if not provided
  if (!speakerId) {
    speakerId =
      localStorage.getItem(LocalStorageKeys.SpeakerDevice) || undefined
  }

  // Create audio element if it doesn't exist
  if (!audioElement) {
    audioElement = new Audio()
    audioElement.autoplay = true
    mediaSource = new MediaSource()
    if (!mediaSource) {
      throw new Error('Failed to create MediaSource')
    }
    audioElement.src = URL.createObjectURL(mediaSource)

    // Setup MediaSource when it opens
    const ms = mediaSource
    ms.addEventListener('sourceopen', () => {
      sourceBuffer = ms.addSourceBuffer('audio/mpeg')

      // Add a single updateend listener that will process the queue
      sourceBuffer.addEventListener('updateend', () => {
        processQueue()
      })

      // Process any pending blobs
      if (pendingBlobs.length > 0) {
        processQueue()
      }
    })

    // Connect audio element to analyser when we have data
    audioElement.addEventListener('timeupdate', function onTimeUpdate() {
      if (!audioContext || !speakerAnalyser || !audioElement) return

      try {
        // Use type assertion for captureStream which is available in modern browsers
        const mediaStream = (audioElement as any).captureStream() as MediaStream

        // Check if we have an audio track
        if (mediaStream.getAudioTracks().length === 0) return

        currentMediaStream = mediaStream
        const sourceNode = audioContext.createMediaStreamSource(mediaStream)
        sourceNode.connect(speakerAnalyser.node)

        // Remove the listener once we've successfully connected
        audioElement.removeEventListener('timeupdate', onTimeUpdate)
      } catch (error) {
        console.error('Error creating media stream source:', error)
      }
    })
  }

  // Set sink ID if provided
  if (speakerId) {
    try {
      await setSinkId(speakerId)
    } catch (error) {
      console.error(`Error setting Audio Output to ${speakerId}`, error)
    }
  }

  return audioElement
}

async function processQueue() {
  if (!sourceBuffer || !mediaSource || pendingBlobs.length === 0) return
  if (isProcessingQueue || sourceBuffer.updating) return

  isProcessingQueue = true
  try {
    await playNextBlob()
  } finally {
    isProcessingQueue = false
    // If there are more blobs and we're not updating, process the next one
    if (pendingBlobs.length > 0 && !sourceBuffer.updating) {
      processQueue()
    }
  }
}

async function playNextBlob() {
  if (!sourceBuffer || !mediaSource || pendingBlobs.length === 0) return
  if (sourceBuffer.updating) return

  // Check if MediaSource is still valid
  if (mediaSource.readyState !== 'open') {
    console.warn('MediaSource is no longer open, resetting audio pipeline')
    stopAudio()
    await setupAudioElement()
    return
  }

  const blob = pendingBlobs.shift()!

  try {
    // Double check sourceBuffer is still valid before appending
    if (
      sourceBuffer &&
      Array.from(mediaSource.sourceBuffers).includes(sourceBuffer)
    ) {
      const arrayBuffer = await blob.arrayBuffer()
      sourceBuffer.appendBuffer(arrayBuffer)
    } else {
      console.warn('SourceBuffer is no longer valid, resetting audio pipeline')
      stopAudio()
      await setupAudioElement()
    }
  } catch (error) {
    console.error('Error appending buffer', error)
    if (error instanceof Error && error.name === 'InvalidStateError') {
      console.warn('Resetting audio pipeline due to invalid state')
      stopAudio()
      await setupAudioElement()
    }
  }
}

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

export async function changeSpeakerDevice(speakerId: string) {
  if (!canChangeSpeakerDevice()) return
  try {
    await setupAudioElement(speakerId)
    localStorage.setItem(LocalStorageKeys.SpeakerDevice, speakerId)
  } catch (error) {
    console.error(`Error setting Audio Output to ${speakerId}`, error)
  }
}

export function pauseAudio() {
  if (audioElement) {
    audioElement.pause()
  }
}

export function resumeAudio() {
  if (audioElement) {
    audioElement.play()
  }
}

export async function playAudio(blob: Blob) {
  if (!audioContext || !speakerAnalyser) return

  // Add blob to pending queue
  pendingBlobs.push(blob)

  // Initialize audio element if needed
  if (!audioElement) {
    await setupAudioElement()
  }

  if (!audioElement) return

  try {
    // Start playing if not already playing
    if (audioElement.paused) {
      audioElement.play()
    }

    // Try to process the queue if we can
    if (sourceBuffer && !sourceBuffer.updating && !isProcessingQueue) {
      processQueue()
    }
  } catch (error) {
    console.error('Error playing audio blob', error, blob)
  }
}

export function stopAudio() {
  // Clear pending blobs
  pendingBlobs.length = 0

  // Reset the MediaSource if needed
  if (mediaSource) {
    try {
      if (mediaSource.readyState === 'open') {
        mediaSource.endOfStream()
      }
      if (sourceBuffer && mediaSource.readyState !== 'closed') {
        mediaSource.removeSourceBuffer(sourceBuffer)
      }
    } catch (error) {
      console.error('Error cleaning up media source', error)
    }
    mediaSource = undefined
    sourceBuffer = undefined
  }

  // Destroy audio element
  if (audioElement) {
    audioElement.pause()
    audioElement.src = ''
    audioElement = undefined
  }

  // Clean up media stream
  if (currentMediaStream) {
    currentMediaStream.getTracks().forEach((track) => track.stop())
    currentMediaStream = undefined
  }
}
