import EventEmitter from 'eventemitter3'
import { defaultMicThreshold } from './mic'
import { createDelayedStream } from './utils/delayedStream'
import { LocalStorageKeys } from './utils/localStorage'
import { stopStream } from './utils/stopStream'
import { SileroVAD } from './vad/SileroVAD'
import { VAD } from './vad/VAD'
import { VolumeVAD } from './vad/VolumeVAD'

const timeSlice = 100

export type MicRecorderVAD = VAD | 'volume' | 'silero'

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
  private vad?: VAD
  private recorder: MediaRecorder | undefined
  private delayedStream: MediaStream | undefined
  private speakingConfirmed = false
  private queuedChunks: Blob[] = []

  constructor(private vadConfig?: MicRecorderVAD) {
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

      if (!this.vad) {
        this.vad = this.initVAD(this.vadConfig)
      }

      // Create a delayed stream to avoid cutting after speech detection
      const delayedStream = createDelayedStream(
        stream,
        this.vad.delay / 1000 + 0.05
      )
      this.delayedStream = delayedStream

      // Setup RTC recorder
      if (this.recorder) {
        this.recorder.stop()
      }
      this.recorder = new window.MediaRecorder(delayedStream, {
        mimeType: this.audioInfo.mimeType,
        audioBitsPerSecond: 128000,
      })
      this.recorder.ondataavailable = this.onDataAvailable.bind(this)

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
    this.vad?.setThreshold(threshold)
  }

  private initVAD(vad?: VAD | 'volume' | 'silero'): VAD {
    if (!vad) return new VolumeVAD()
    if (vad === 'volume') return new VolumeVAD()
    if (vad === 'silero') return new SileroVAD()
    return vad
  }

  private async startSpeakingDetection(stream: MediaStream) {
    if (!this.vad) {
      throw new Error('VAD not initialized')
    }
    if (this.vad.isStarted) {
      this.vad.stop()
    }
    this.vad.on('StartSpeaking', this.onStartSpeaking)
    this.vad.on('ConfirmSpeaking', this.onConfirmSpeaking)
    this.vad.on('CancelSpeaking', this.onCancelSpeaking)
    this.vad.on('StopSpeaking', this.onStopSpeaking)
    await this.vad.start(stream, this.state.threshold)
  }

  private async stopSpeakingDetection() {
    if (!this.vad) {
      throw new Error('VAD not initialized')
    }
    this.vad.off('StartSpeaking', this.onStartSpeaking)
    this.vad.off('ConfirmSpeaking', this.onConfirmSpeaking)
    this.vad.off('CancelSpeaking', this.onCancelSpeaking)
    this.vad.off('StopSpeaking', this.onStopSpeaking)
    await this.vad.stop()
  }

  private onStartSpeaking = (async () => {
    if (!this.recorder || this.state.isMuted) return
    try {
      this.recorder.start(timeSlice)
      this.queuedChunks.length = 0
    } catch (error) {
      console.error(error)
    }
  }).bind(this)

  private onConfirmSpeaking = (async () => {
    if (this.state.isMuted) return
    this.emit('StartSpeaking')
    this.changeState({ isSpeaking: true })
    this.speakingConfirmed = true
  }).bind(this)

  private onCancelSpeaking = (async () => {
    if (!this.recorder) return
    try {
      this.recorder.stop()
    } catch (error) {
      console.error(error)
    }
    this.queuedChunks.length = 0
  }).bind(this)

  private onStopSpeaking = (async () => {
    if (!this.recorder) return
    try {
      this.recorder.stop()
    } catch (error) {
      console.error(error)
    }
    this.changeState({ isSpeaking: false })
    this.emit('StopSpeaking')
    this.speakingConfirmed = false
  }).bind(this)

  private async onDataAvailable(blobEvent: BlobEvent) {
    if (!this.speakingConfirmed) {
      // Queue the chunk until speech is confirmed
      this.queuedChunks.push(blobEvent.data)
      return
    }

    // Emit all queued chunks if there are any
    for (const chunk of this.queuedChunks) {
      this.emit('Chunk', chunk)
    }
    this.queuedChunks.length = 0

    // Emit the last chunk
    this.emit('Chunk', blobEvent.data)
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
