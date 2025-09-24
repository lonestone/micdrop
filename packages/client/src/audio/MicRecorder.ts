import { EventEmitter } from 'eventemitter3'
import { audioContext } from './utils/audioContext'
import { createDelayedStream } from './utils/delayedStream'
import { stopStream } from './utils/stopStream'
import { VAD, VADStatus } from './vad/VAD'
import { equalVADConfig, getVAD, VADConfig } from './vad/getVAD'
import { initPcmProcessor } from './pcm-processor'

const SAMPLE_RATE = 16000

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
  Chunk: [Int16Array]
  StartSpeaking: void
  StopSpeaking: void
  StateChange: [MicRecorderState]
}

export class MicRecorder extends EventEmitter<MicRecorderEvents> {
  public state: MicRecorderState
  public vad: VAD

  private stream: MediaStream | undefined
  private source: MediaStreamAudioSourceNode | undefined
  private workletNode: AudioWorkletNode | undefined
  private delayedStream: MediaStream | undefined
  private speakingConfirmed = false
  private queuedChunks: Int16Array[] = []

  constructor(private vadConfig?: VADConfig) {
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
      this.stream = stream
      this.speakingConfirmed = false

      // Create a worklet node with the PCM processor
      await initPcmProcessor()
      this.workletNode = new AudioWorkletNode(audioContext, 'pcm-processor')
      this.workletNode.port.onmessage = this.onWorkletMessage

      // Send sample rate configuration to worklet
      this.workletNode.port.postMessage({
        type: 'configure',
        sourceSampleRate: audioContext.sampleRate,
        targetSampleRate: SAMPLE_RATE,
      })

      // Create a delayed stream to avoid cutting after speech detection
      const delayedStream = createDelayedStream(
        stream,
        this.vad.delay / 1000 + 0.05
      )
      this.delayedStream = delayedStream

      // Connect the source node to the worklet node
      this.source = audioContext.createMediaStreamSource(delayedStream)
      this.source.connect(this.workletNode)

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
    this.stream = undefined

    try {
      // Stop speaking detection
      this.vad.stop()
      this.vad.off('StartSpeaking', this.onStartSpeaking)
      this.vad.off('ConfirmSpeaking', this.onConfirmSpeaking)
      this.vad.off('CancelSpeaking', this.onCancelSpeaking)
      this.vad.off('StopSpeaking', this.onStopSpeaking)

      // Stop Web Audio API
      if (this.workletNode) {
        this.workletNode.disconnect()
        this.workletNode = undefined
      }
      if (this.source) {
        this.source.disconnect()
        this.source = undefined
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

  changeVad = (vadConfig: VADConfig) => {
    if (equalVADConfig(vadConfig, this.vadConfig)) return

    const stream = this.stream
    if (stream) {
      this.stop()
    }

    this.vadConfig = vadConfig
    this.vad = getVAD(vadConfig)

    if (stream) {
      this.start(stream)
    }
  }

  private onStartSpeaking = async () => {
    if (this.state.isMuted) return
    this.speakingConfirmed = false
    this.queuedChunks.length = 0

    // Start recording
    this.workletNode?.port.postMessage({ type: 'start' })
  }

  private onConfirmSpeaking = async () => {
    if (this.state.isMuted) return
    this.speakingConfirmed = true
    this.changeState({ isSpeaking: true })
    this.emit('StartSpeaking')
  }

  private onCancelSpeaking = async () => {
    if (this.state.isMuted) return
    this.queuedChunks.length = 0

    // Stop recording
    this.workletNode?.port.postMessage({ type: 'stop' })
  }

  private onStopSpeaking = async () => {
    if (this.state.isMuted) return
    this.speakingConfirmed = false
    this.changeState({ isSpeaking: false })
    this.emit('StopSpeaking')

    // Stop recording
    this.workletNode?.port.postMessage({ type: 'stop' })
  }

  private onWorkletMessage = (event: MessageEvent) => {
    if (this.state.isMuted) return

    const { type, data } = event.data
    if (type === 'chunk') {
      const pcmData = data as Int16Array

      if (!this.speakingConfirmed) {
        // Queue the chunk until speech is confirmed
        this.queuedChunks.push(pcmData)
        return
      }

      // Emit all queued chunks if there are any
      for (const chunk of this.queuedChunks) {
        this.emit('Chunk', chunk)
      }
      this.queuedChunks.length = 0

      // Emit the current chunk
      this.emit('Chunk', pcmData)
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
}
