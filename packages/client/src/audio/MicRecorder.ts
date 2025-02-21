import EventEmitter from 'eventemitter3'
import hark, { Harker } from 'hark'
import { LocalStorageKeys } from './localStorage'
import { createDelayedStream, defaultMicThreshold } from './microphone'
import { stopStream } from './stopStream'

const timeSlice = 500

export interface MicRecorderState {
  isStarting: boolean
  isStarted: boolean
  isMuted: boolean
  isSpeaking: boolean
  threshold: number
}

const defaultMicRecorderState: MicRecorderState = {
  isStarting: false,
  isStarted: false,
  isMuted: false,
  isSpeaking: false,
  threshold: defaultMicThreshold,
}

export interface MicRecorderEvents {
  Chunk: [Blob]
  StartSpeaking: void
  StopSpeaking: void
  StateChange: [MicRecorderState]
}

interface AudioInfo {
  mimeType: string
  ext: string
}

export class MicRecorder extends EventEmitter<MicRecorderEvents> {
  public state: MicRecorderState

  private audioInfo = this.getAudioInfo()
  private hark: Harker | undefined
  private recorder: MediaRecorder | undefined
  private delayedStream: MediaStream | undefined

  constructor() {
    super()

    // Threshold for speech detection
    const threshold =
      parseFloat(localStorage.getItem(LocalStorageKeys.MicThreshold) || '0') ||
      defaultMicThreshold

    // Set initial state
    this.state = { ...defaultMicRecorderState, threshold }
  }

  async start(stream: MediaStream) {
    if (this.state.isStarted) {
      throw new Error('MicRecorder is already started')
    }
    try {
      // Update state to starting
      this.changeState({
        isStarting: true,
        isMuted: false,
        isSpeaking: false,
      })

      // Create a delayed stream to avoid cutting after speech detection
      const delayedStream = createDelayedStream(stream)
      this.delayedStream = delayedStream

      // Setup RTC recorder
      if (!this.recorder) {
        this.recorder = new window.MediaRecorder(delayedStream, {
          mimeType: this.audioInfo.mimeType,
          audioBitsPerSecond: 128000,
        })
        this.recorder.ondataavailable = this.onDataAvailable.bind(this)
      }

      // Start speaking detection
      await this.startSpeakingDetection(stream)

      this.changeState({
        isStarting: false,
        isStarted: true,
      })
    } catch (err) {
      this.stop()
      console.error(err)
    }
  }

  mute() {
    this.changeState({ isMuted: true, isSpeaking: false })
    this.recorder?.stop()
  }

  unmute() {
    this.changeState({ isMuted: false })
  }

  stop() {
    this.changeState({
      isStarting: false,
      isStarted: false,
      isMuted: false,
      isSpeaking: false,
    })

    try {
      this.stopSpeakingDetection()
      if (this.recorder) {
        this.recorder.stop()
        this.recorder = undefined
      }
      if (this.delayedStream) {
        stopStream(this.delayedStream)
        this.delayedStream = undefined
      }
    } catch (err) {
      console.error(err)
    }
  }

  setThreshold(threshold: number) {
    this.changeState({ threshold })
    localStorage.setItem(LocalStorageKeys.MicThreshold, threshold.toString())
    this.hark?.setThreshold(threshold)
  }

  private async startSpeakingDetection(stream: MediaStream) {
    if (this.hark) return
    this.hark = hark(stream, {
      interval: 100,
      play: false,
      threshold: this.state.threshold,
    })
    this.hark.on('speaking', this.onStartSpeaking)
    this.hark.on('stopped_speaking', this.onStopSpeaking)
  }

  private stopSpeakingDetection() {
    if (!this.hark) return
    // @ts-ignore
    this.hark.off('speaking', this.onStartSpeaking)
    // @ts-ignore
    this.hark.off('stopped_speaking', this.onStopSpeaking)
    this.hark.stop()
    this.hark = undefined
  }

  private onStartSpeaking = (async () => {
    if (!this.recorder || this.state.isMuted) return
    this.recorder.start(timeSlice)
    this.emit('StartSpeaking')
    this.changeState({ isSpeaking: true })
  }).bind(this)

  private onStopSpeaking = (async () => {
    if (!this.recorder || this.state.isMuted) return
    this.recorder.stop()
    this.changeState({ isSpeaking: false })
  }).bind(this)

  private async onDataAvailable(blobEvent: BlobEvent) {
    this.emit('Chunk', blobEvent.data)

    if (!this.state.isSpeaking) {
      // It was the last used data until the user stopped speaking
      this.emit('StopSpeaking')
    }
  }

  private changeState(state: Partial<MicRecorderState>) {
    const hasChanged = Object.keys(state).some(
      (key) =>
        this.state[key as keyof MicRecorderState] !==
        state[key as keyof MicRecorderState]
    )
    if (!hasChanged) return
    this.state = { ...this.state, ...state }
    this.emit('StateChange', this.state)
  }

  private getAudioInfo(): AudioInfo {
    if (window.MediaRecorder.isTypeSupported('audio/ogg')) {
      return { mimeType: 'audio/ogg', ext: 'ogg' }
    } else if (window.MediaRecorder.isTypeSupported('audio/webm')) {
      return { mimeType: 'audio/webm', ext: 'webm' }
    } else if (window.MediaRecorder.isTypeSupported('audio/mp4')) {
      return { mimeType: 'audio/mp4', ext: 'm4a' }
    }
    return { mimeType: 'audio/wav', ext: 'wav' }
  }
}
