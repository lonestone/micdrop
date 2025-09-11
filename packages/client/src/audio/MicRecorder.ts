import { EventEmitter } from 'eventemitter3'
import pcmProcessorWorklet from './pcm-processor-worklet?raw'
import { audioContext } from './utils/audioContext'
import { createDelayedStream } from './utils/delayedStream'
import { stopStream } from './utils/stopStream'
import { VAD, VADStatus } from './vad/VAD'
import { getVAD, VADConfig } from './vad/getVAD'

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

  private source: MediaStreamAudioSourceNode | undefined
  private workletNode: AudioWorkletNode | undefined
  private delayedStream: MediaStream | undefined
  private workletUrl: string
  private speakingConfirmed = false
  private queuedChunks: Int16Array[] = []

  constructor(vadConfig?: VADConfig) {
    super()

    // Set initial state
    this.state = defaultMicRecorderState

    // Init worklet URL
    const workletBlob = new Blob([pcmProcessorWorklet], {
      type: 'application/javascript',
    })
    this.workletUrl = URL.createObjectURL(workletBlob)

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
      this.speakingConfirmed = false

      // Create a delayed stream to avoid cutting after speech detection
      const delayedStream = createDelayedStream(
        stream,
        this.vad.delay / 1000 + 0.05
      )
      this.delayedStream = delayedStream

      // Load the worklet module
      await audioContext.audioWorklet.addModule(this.workletUrl)

      this.source = audioContext.createMediaStreamSource(delayedStream)
      this.workletNode = new AudioWorkletNode(audioContext, 'pcm-processor')

      this.workletNode.port.onmessage = this.onWorkletMessage
      this.source.connect(this.workletNode)

      // Send sample rate configuration to worklet
      this.workletNode.port.postMessage({
        type: 'configure',
        sourceSampleRate: audioContext.sampleRate,
        targetSampleRate: SAMPLE_RATE,
      })

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
