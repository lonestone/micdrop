import { audioContext } from '../utils/audioContext'
import { AudioStream } from './AudioStream'

const AUDIO_MIME_TYPE = 'audio/webm; codecs=opus'

window.MediaSource = window.MediaSource || (window as any).webkitMediaSource

export class WebmOpusAudioStream extends AudioStream {
  private audioElement?: HTMLAudioElement
  private outputSourceNode?: AudioNode
  private mediaSource?: MediaSource
  private sourceBuffer?: SourceBuffer
  private bufferQueue: Blob[] = []
  private isBufferUpdating: boolean = false
  private isSourceBufferInitialized: boolean = false
  private endCheckTimeout?: number
  private lastAudioCurrentTime?: number

  static get isCompatible() {
    return MediaSource?.isTypeSupported(AUDIO_MIME_TYPE)
  }

  start(): AudioNode {
    if (!this.audioElement) {
      this.setupAudioElement()
    }
    if (!this.mediaSource) {
      this.setupMediaSource()
    }
    return this.outputNode
  }

  async playAudio(blob: Blob) {
    this.start()
    try {
      // Add blob to buffer queue
      this.bufferQueue.push(blob)
      this.processBufferQueue()

      // Start playing if not already playing
      if (this.audioElement?.paused) {
        this.audioElement.play()
      }
    } catch (error) {
      console.error('Error playing audio blob', error, blob)
    }
  }

  stopAudio() {
    if (!this.isPlaying) return
    if (this.audioElement) {
      this.audioElement.pause()

      // Seek to the end of loaded chunks to prevent resuming from current position
      if (this.audioElement.buffered.length > 0) {
        const lastBufferedEnd = this.audioElement.buffered.end(
          this.audioElement.buffered.length - 1
        )
        this.audioElement.currentTime = lastBufferedEnd
      }
    }

    this.bufferQueue.length = 0
    this.mediaSource?.endOfStream()
    this.mediaSource = undefined
  }

  private setupAudioElement() {
    if (this.audioElement || this.outputSourceNode) return

    // Create audio element if it doesn't exist
    this.audioElement = new Audio()
    this.audioElement.autoplay = true

    // Add event listeners to track playing state
    this.audioElement.addEventListener('play', () => this.setIsPlaying(true))
    this.audioElement.addEventListener('pause', () => this.setIsPlaying(false))
    this.audioElement.addEventListener('ended', () => this.setIsPlaying(false))
    this.audioElement.addEventListener('playing', () => this.setIsPlaying(true))

    // Add error event listener to handle media errors
    this.audioElement.addEventListener('error', this.onAudioError)

    // Add timeupdate listener to detect when we've reached the end of buffered content
    this.audioElement.addEventListener('timeupdate', this.onAudioTimeUpdate)

    // Create a media element source to analyze speaker and play sound through selected device
    this.outputSourceNode = audioContext.createMediaElementSource(
      this.audioElement
    )
    this.outputSourceNode.connect(this.outputNode)
  }

  private onAudioError = () => {
    console.error(
      'Audio element error detected, reinitializing MediaSource',
      this.audioElement?.error
    )
    this.setIsPlaying(false)
    this.setupMediaSource()
  }

  private onSourceOpen = () => {
    if (!this.mediaSource || this.isSourceBufferInitialized) return
    try {
      this.sourceBuffer = this.mediaSource.addSourceBuffer(AUDIO_MIME_TYPE)
      this.sourceBuffer.mode = 'sequence'
      this.sourceBuffer.addEventListener('updateend', this.onUpdateEnd)
      this.isSourceBufferInitialized = true
      this.processBufferQueue()
    } catch (e) {
      console.error('Error initializing SourceBuffer', e)
    }
  }

  private async processBufferQueue() {
    if (
      !this.sourceBuffer ||
      this.sourceBuffer.updating ||
      this.isBufferUpdating ||
      !this.bufferQueue.length
    ) {
      return
    }

    // Check if audio element has an error before attempting to append
    if (this.audioElement?.error) {
      console.warn(
        'Audio element has error, skipping buffer append. Error:',
        this.audioElement.error
      )
      return
    }

    const blob = this.bufferQueue.shift()
    if (!blob) return

    try {
      this.isBufferUpdating = true
      const arrayBuffer = await blob.arrayBuffer()

      // Double-check that we can still append (element might have errored during arrayBuffer conversion)
      if (this.audioElement?.error) {
        console.warn('Audio element error detected during buffer processing')
        this.isBufferUpdating = false
        return
      }

      // Also check that sourceBuffer is still valid
      if (!this.sourceBuffer || this.mediaSource?.readyState !== 'open') {
        console.warn('SourceBuffer or MediaSource not ready for append')
        this.isBufferUpdating = false
        return
      }

      this.sourceBuffer.appendBuffer(arrayBuffer)
    } catch (e) {
      console.error('Error appending buffer', e)
      this.isBufferUpdating = false

      // If this is the specific error we're trying to fix, reinitialize
      if (e instanceof DOMException && e.name === 'InvalidStateError') {
        console.warn('InvalidStateError detected, reinitializing MediaSource')
        this.onAudioError()
      }
    }
  }

  // When the source buffer is updated, process the buffer queue
  private onUpdateEnd = async () => {
    this.isBufferUpdating = false
    await this.processBufferQueue()
  }

  private onAudioTimeUpdate = () => {
    if (
      !this.audioElement ||
      !this.isPlaying ||
      this.audioElement.paused ||
      this.bufferQueue.length > 0
    ) {
      return
    }

    // Start checking for audio end
    this.startEndCheckInterval()
  }

  private startEndCheckInterval() {
    this.lastAudioCurrentTime = this.audioElement?.currentTime
    this.clearEndCheckInterval()
    this.endCheckTimeout = window.setTimeout(() => {
      this.checkIfAudioEnded()
    }, 200)
  }

  private clearEndCheckInterval() {
    clearTimeout(this.endCheckTimeout)
    this.endCheckTimeout = undefined
  }

  private checkIfAudioEnded() {
    if (
      !this.audioElement ||
      !this.isPlaying ||
      this.audioElement.paused ||
      this.bufferQueue.length > 0
    ) {
      this.clearEndCheckInterval()
      return
    }

    const currentTime = this.audioElement.currentTime
    if (this.lastAudioCurrentTime == currentTime) {
      this.audioElement.pause()
      // "pause" event is not triggered on Firefox when the audio is paused programmatically
      this.setIsPlaying(false)
      this.clearEndCheckInterval()
    }
    this.lastAudioCurrentTime = currentTime
  }

  protected setIsPlaying(isPlaying: boolean) {
    super.setIsPlaying(isPlaying)
    this.clearEndCheckInterval()
  }

  private setupMediaSource() {
    // Clean up existing MediaSource if any
    if (this.mediaSource) {
      try {
        this.mediaSource.removeEventListener('sourceopen', this.onSourceOpen)
        if (this.mediaSource.readyState === 'open') {
          this.mediaSource.endOfStream()
        }
      } catch (e) {
        console.warn('Error cleaning up previous MediaSource', e)
      }
    }

    // Clean up existing source buffer
    if (this.sourceBuffer) {
      try {
        this.sourceBuffer.removeEventListener('updateend', this.onUpdateEnd)
      } catch (e) {
        console.warn('Error cleaning up previous SourceBuffer', e)
      }
      this.sourceBuffer = undefined
    }

    // Create new MediaSource
    this.mediaSource = new MediaSource()

    // Add error handling for MediaSource
    this.mediaSource.addEventListener('sourceopen', this.onSourceOpen)
    this.mediaSource.addEventListener('error', () => {
      console.error('MediaSource error occurred')
      this.onAudioError()
    })

    if (this.audioElement) {
      this.audioElement.src = URL.createObjectURL(this.mediaSource)
    }

    this.isSourceBufferInitialized = false
    this.bufferQueue.length = 0
  }
}
