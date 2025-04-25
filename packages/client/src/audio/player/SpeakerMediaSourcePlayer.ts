import { stopStream } from '../utils/stopStream'
import { SpeakerPlayer } from './SpeakerPlayer'

export class SpeakerMediaSourcePlayer extends SpeakerPlayer {
  public static isCompatible =
    typeof MediaSource !== 'undefined' &&
    MediaSource.isTypeSupported('audio/mpeg')

  private mediaSource: MediaSource | undefined
  private mediaStream: MediaStream | undefined
  private sourceBuffer: SourceBuffer | undefined
  private isProcessingQueue = false
  private pendingBlobs: Blob[] = []
  private audioElement: HTMLAudioElement | undefined
  private sourceNode: MediaStreamAudioSourceNode | undefined

  async setup() {
    if (this.audioElement || this.mediaSource) return

    this.audioElement = new Audio()
    this.audioElement.autoplay = true
    this.audioElement.muted = true
    this.mediaSource = new MediaSource()

    if (!this.mediaSource) {
      throw new Error('Failed to create MediaSource')
    }

    this.audioElement.src = URL.createObjectURL(this.mediaSource)

    // Setup MediaSource when it opens
    await new Promise<void>((resolve) => {
      this.mediaSource?.addEventListener('sourceopen', () => {
        const sourceBuffer = this.mediaSource?.addSourceBuffer('audio/mpeg')
        if (!sourceBuffer) throw new Error('Failed to create SourceBuffer')
        this.sourceBuffer = sourceBuffer

        // Add a single updateend listener that will process the queue
        sourceBuffer.addEventListener('updateend', () => this.processQueue())

        // Process any pending blobs
        this.processQueue()
        resolve()
      })
    })

    // Connect audio element to analyser when we have data
    await new Promise<void>((resolve) => {
      const onTimeUpdate = () => {
        this.audioElement?.removeEventListener('timeupdate', onTimeUpdate)
        if (!this.audioElement) {
          throw new Error('Audio element or audio context not found')
        }

        // Use type assertion for captureStream which is available in modern browsers
        const mediaStream = (
          this.audioElement as any
        ).captureStream() as MediaStream

        // Check if we have an audio track
        if (mediaStream.getAudioTracks().length === 0) return

        this.mediaStream = mediaStream
        this.sourceNode = this.audioContext.createMediaStreamSource(mediaStream)
        this.sourceNode.connect(this.outputNode)
        this.audioElement.currentTime = 0
        resolve()
      }
      this.audioElement?.addEventListener('timeupdate', onTimeUpdate)
    })
  }

  private async processQueue() {
    if (
      !this.sourceBuffer ||
      !this.mediaSource ||
      this.pendingBlobs.length === 0 ||
      this.isProcessingQueue ||
      this.sourceBuffer.updating
    ) {
      return
    }

    this.isProcessingQueue = true
    const blob = this.pendingBlobs.shift()!

    try {
      // Append the blob to the source buffer
      const arrayBuffer = await blob.arrayBuffer()

      // Re-check if still processing (not stopped)
      if (this.isProcessingQueue) {
        this.sourceBuffer.appendBuffer(arrayBuffer)
      }
    } catch (error) {
      console.error('Error appending buffer', error)
    } finally {
      this.isProcessingQueue = false
    }
  }

  addBlob(blob: Blob) {
    this.pendingBlobs.push(blob)

    // Try to process the queue if we can
    if (
      this.sourceBuffer &&
      !this.sourceBuffer.updating &&
      !this.isProcessingQueue
    ) {
      this.processQueue()
    }
  }

  stop() {
    this.destroy()
    this.setup()
  }

  destroy() {
    // Disconnect the audio nodes
    if (this.sourceNode) {
      this.sourceNode.disconnect()
      this.sourceNode = undefined
    }

    // Clear pending blobs
    this.pendingBlobs.length = 0

    // Reset the MediaSource if needed
    if (this.mediaSource) {
      try {
        if (this.mediaSource.readyState === 'open') {
          this.mediaSource.endOfStream()
        }
      } catch (error) {
        console.error('Error cleaning up media source', error)
      }
    }

    // Stop and clean up the audio element
    if (this.audioElement) {
      this.audioElement.pause()
      this.audioElement.src = ''
      this.audioElement = undefined
    }

    // Clean up media stream
    if (this.mediaStream) {
      stopStream(this.mediaStream)
      this.mediaStream = undefined
    }

    this.mediaSource = undefined
    this.sourceBuffer = undefined
  }
}
