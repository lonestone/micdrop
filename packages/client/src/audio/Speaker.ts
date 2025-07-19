import EventEmitter from 'eventemitter3'
import { AudioAnalyser } from './utils/AudioAnalyser'
import { audioContext } from './utils/audioContext'
import { LocalStorageKeys } from './utils/localStorage'

export interface SpeakerEvents {
  StartPlaying: void
  StopPlaying: void
}

const AUDIO_MIME_TYPE = 'audio/webm; codecs=opus'

export class Speaker extends EventEmitter<SpeakerEvents> {
  public isPlaying = false
  public analyser: AudioAnalyser
  public deviceId: string | undefined

  private audioElement?: HTMLAudioElement
  private mediaSource?: MediaSource
  private sourceBuffer?: SourceBuffer
  private bufferQueue: Blob[] = []
  private isBufferUpdating: boolean = false
  private isSourceBufferInitialized: boolean = false
  private analyzerSourceNode?: MediaStreamAudioSourceNode
  private endCheckTimeout?: number
  private analyserRetryCount: number = 0
  private readonly maxAnalyserRetries: number = 5
  private readonly analyserRetryDelay: number = 200
  private analyserRetryTimeout?: number
  private lastAudioCurrentTime?: number

  constructor() {
    super()
    this.analyser = new AudioAnalyser(audioContext)
    this.setupAudioElement()
    this.setupMediaSource()
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

  private setIsPlaying(isPlaying: boolean) {
    if (this.isPlaying == isPlaying) return
    this.isPlaying = isPlaying
    this.emit(isPlaying ? 'StartPlaying' : 'StopPlaying')

    // Clear end check interval when not playing
    if (!isPlaying) {
    }
  }

  private connectAnalyser = () => {
    // Don't try to connect if already connected or no audio element
    if (this.analyzerSourceNode || !this.audioElement) return

    // Clear any pending retry
    if (this.analyserRetryTimeout) {
      clearTimeout(this.analyserRetryTimeout)
      this.analyserRetryTimeout = undefined
    }

    try {
      // Check if audio element is ready and playing
      if (this.audioElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        throw new Error('Audio element not ready')
      }

      // Try to capture stream from audio element (Chrome/Edge approach)
      let stream: MediaStream | null = null

      // Check if captureStream is available (not on Firefox)
      if (typeof (this.audioElement as any).captureStream === 'function') {
        try {
          stream = (this.audioElement as any).captureStream()
        } catch (e) {
          console.warn('captureStream failed, trying alternative approach', e)
        }
      }

      // Firefox-compatible alternative: Use Web Audio API with MediaStreamDestination
      if (!stream || stream.getAudioTracks().length === 0) {
        // For Firefox and browsers without captureStream support,
        // we need to route the audio through Web Audio API

        // Create a MediaElementAudioSourceNode from the audio element
        const mediaElementSource = audioContext.createMediaElementSource(
          this.audioElement
        )

        // Create a MediaStreamDestination to convert back to MediaStream
        const mediaStreamDestination =
          audioContext.createMediaStreamDestination()

        // Create a gain node for audio passthrough
        const gainNode = audioContext.createGain()
        gainNode.gain.value = 1.0

        // Connect: MediaElement -> Gain -> MediaStreamDestination
        mediaElementSource.connect(gainNode)
        gainNode.connect(mediaStreamDestination)

        // Also connect back to audioContext.destination so we can still hear the audio
        gainNode.connect(audioContext.destination)

        // Get the stream from the destination
        stream = mediaStreamDestination.stream
      }

      if (!stream || stream.getAudioTracks().length === 0) {
        throw new Error('No audio tracks available')
      }

      // Successfully got the stream, create analyser connection
      this.analyzerSourceNode = audioContext.createMediaStreamSource(stream)
      this.analyzerSourceNode.connect(this.analyser.node)
      this.analyserRetryCount = 0 // Reset retry count on success
    } catch (e) {
      // Retry after a delay if we haven't exceeded max retries
      if (this.analyserRetryCount < this.maxAnalyserRetries) {
        console.log('Retrying analyser connection', this.analyserRetryCount)
        this.analyserRetryCount++
        this.analyserRetryTimeout = window.setTimeout(() => {
          this.connectAnalyser()
        }, this.analyserRetryDelay)
      } else {
        console.error('Error connecting analyser to audioElement', e)
      }
    }
  }

  canChangeDevice(): boolean {
    return (
      window.HTMLMediaElement && 'sinkId' in window.HTMLMediaElement.prototype
    )
  }

  async changeDevice(deviceId: string) {
    if (!this.canChangeDevice()) return
    try {
      this.deviceId = deviceId
      localStorage.setItem(LocalStorageKeys.SpeakerDevice, deviceId)
      await this.audioElement?.setSinkId(deviceId)
    } catch (error) {
      console.error(`Error setting Audio Output to ${deviceId}`, error)
    }
  }

  pauseAudio() {
    if (this.audioElement) {
      this.audioElement.pause()
    }
  }

  resumeAudio() {
    if (this.audioElement) {
      this.audioElement.play()
    }
  }

  private setupAudioElement() {
    // Dispose of the existing audio element
    if (this.audioElement) {
      this.audioElement.pause()
      this.audioElement.src = ''
      this.audioElement = undefined
    }

    // Create audio element if it doesn't exist
    this.audioElement = new Audio()
    this.audioElement.autoplay = true

    // Select speaker device if speakerId is in local storage
    const deviceId = localStorage.getItem(LocalStorageKeys.SpeakerDevice)
    if (deviceId) {
      this.changeDevice(deviceId)
    }

    // Connect analyser once when audio starts playing
    this.audioElement.addEventListener('canplay', this.connectAnalyser)

    // Add event listeners to track playing state
    this.audioElement.addEventListener('play', () => this.setIsPlaying(true))
    this.audioElement.addEventListener('pause', () => this.setIsPlaying(false))
    this.audioElement.addEventListener('ended', () => this.setIsPlaying(false))
    this.audioElement.addEventListener('playing', () => {
      this.setIsPlaying(true)
      // Try to connect analyser when actually playing
      this.connectAnalyser()
    })

    // Add error event listener to handle media errors
    this.audioElement.addEventListener('error', this.onAudioError)

    // Add timeupdate listener to detect when we've reached the end of buffered content
    this.audioElement.addEventListener('timeupdate', this.onAudioTimeUpdate)
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
      // Set deviceId again
      if (this.deviceId) {
        this.changeDevice(this.deviceId)
      }
    }

    this.isSourceBufferInitialized = false
    this.bufferQueue.length = 0
  }

  async playAudio(blob: Blob) {
    if (!this.audioElement) return
    try {
      if (!this.mediaSource) {
        this.setupMediaSource()
      }

      // Add blob to buffer queue
      this.bufferQueue.push(blob)
      this.processBufferQueue()

      // Start playing if not already playing
      if (this.audioElement.paused) {
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
}
