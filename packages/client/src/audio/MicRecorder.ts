import { EventEmitter } from 'eventemitter3'
import { createDelayedStream } from './utils/delayedStream'
import { stopStream } from './utils/stopStream'
import { VAD, VADStatus } from './vad/VAD'
import { getVAD, VADConfig } from './vad/getVAD'

const timeSlice = 100

export interface MicRecorderState {
  isStarting: boolean
  isStarted: boolean
  isMuted: boolean
  isSpeaking: boolean
}

const defaultMicRecorderState: MicRecorderState = {
  isStarting: false,
  isStarted: false,
  isMuted: false,
  isSpeaking: false,
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
  public vad: VAD

  private audioInfo = this.getAudioInfo()
  private recorder: MediaRecorder | undefined
  private delayedStream: MediaStream | undefined
  private speakingConfirmed = false
  private queuedChunks: Blob[] = []

  constructor(vadConfig?: VADConfig) {
    super()

    // Set initial state
    this.state = defaultMicRecorderState

    // Init VAD
    this.vad = getVAD(vadConfig)
  }

  start = async (stream: MediaStream) => {
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
      this.recorder.ondataavailable = this.onDataAvailable

      // Start speaking detection
      await this.vad.start(stream)
      this.vad.on('StartSpeaking', this.onStartSpeaking)
      this.vad.on('ConfirmSpeaking', this.onConfirmSpeaking)
      this.vad.on('CancelSpeaking', this.onCancelSpeaking)
      this.vad.on('StopSpeaking', this.onStopSpeaking)

      this.changeState({
        isStarting: false,
        isStarted: true,
      })
    } catch (err) {
      this.stop()
      console.error(err)
    }
  }

  mute = () => {
    if (this.state.isMuted) return

    // Force stop speaking
    if (this.state.isSpeaking) {
      this.onStopSpeaking()
    }
    this.changeState({ isMuted: true })
  }

  unmute = () => {
    if (!this.state.isMuted) return
    this.changeState({ isMuted: false })

    // Start speaking if already speaking
    if (this.vad.status === VADStatus.MaybeSpeaking) {
      this.onStartSpeaking()
    } else if (this.vad.status === VADStatus.Speaking) {
      this.onStartSpeaking()
      this.onConfirmSpeaking()
    }
  }

  stop = () => {
    this.changeState({
      isStarting: false,
      isStarted: false,
      isMuted: false,
      isSpeaking: false,
    })

    try {
      // Stop speaking detection
      this.vad.stop()
      this.vad.off('StartSpeaking', this.onStartSpeaking)
      this.vad.off('ConfirmSpeaking', this.onConfirmSpeaking)
      this.vad.off('CancelSpeaking', this.onCancelSpeaking)
      this.vad.off('StopSpeaking', this.onStopSpeaking)

      // Stop recorder
      if (this.recorder) {
        this.recorder.stop()
        this.recorder = undefined
      }

      // Stop delayed stream
      if (this.delayedStream) {
        stopStream(this.delayedStream)
        this.delayedStream = undefined
      }
    } catch (err) {
      console.error(err)
    }
  }

  private onStartSpeaking = async () => {
    if (!this.recorder || this.state.isMuted) return
    try {
      this.recorder.start(timeSlice)
      this.queuedChunks.length = 0
      this.speakingConfirmed = false
    } catch (error) {
      console.error(error)
    }
  }

  private onConfirmSpeaking = async () => {
    if (this.state.isMuted) return
    this.emit('StartSpeaking')
    this.changeState({ isSpeaking: true })
    this.speakingConfirmed = true
  }

  private onCancelSpeaking = async () => {
    if (this.state.isMuted) return
    try {
      this.recorder?.stop()
    } catch (error) {
      console.error(error)
    }
    this.queuedChunks.length = 0
  }

  private onStopSpeaking = async () => {
    if (this.state.isMuted) return
    try {
      this.recorder?.stop()
    } catch (error) {
      console.error(error)
    }
    this.changeState({ isSpeaking: false })
    this.emit('StopSpeaking')
    this.speakingConfirmed = false
  }

  private onDataAvailable = async (blobEvent: BlobEvent) => {
    if (this.state.isMuted) return

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
