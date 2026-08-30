import { EventEmitter } from 'eventemitter3'
import { concatFloat32, floatToPcm16, resample } from './pcm'
import { MicSource } from './types'
import { equalVADConfig, getVAD, VADConfig } from './vad/getVAD'
import { VAD } from './vad/VAD'

const SAMPLE_RATE = 16000
const CHUNK_INTERVAL = 100 // ms

export interface MicRecorderState {
  isStarting: boolean
  isStarted: boolean
  isSpeaking: boolean
}

const defaultMicRecorderState: MicRecorderState = {
  isStarting: false,
  isStarted: false,
  isSpeaking: false,
}

export interface MicRecorderEvents {
  Chunk: [Int16Array]
  StartSpeaking: void
  StopSpeaking: void
  StateChange: [MicRecorderState]
}

/**
 * Turns what the microphone captures into the chunks sent to the server.
 *
 * It only records while the VAD hears someone, and keeps a short reserve of
 * audio so the first syllable, spoken before the VAD reacted, is sent too.
 */
export class MicRecorder extends EventEmitter<MicRecorderEvents> {
  public state: MicRecorderState
  public vad: VAD

  private mic: MicSource | undefined
  private isRecording = false
  private speakingConfirmed = false
  private sourceSampleRate = SAMPLE_RATE
  private reserve: Float32Array[] = []
  private reserveLength = 0
  private buffer: Float32Array[] = []
  private bufferLength = 0
  private queuedChunks: Int16Array[] = []

  constructor(private vadConfig?: VADConfig) {
    super()

    // Set initial state
    this.state = defaultMicRecorderState
    // Init VAD
    this.vad = getVAD(vadConfig)
  }

  start = async (mic: MicSource) => {
    if (this.state.isStarted) {
      throw new Error('MicRecorder is already started')
    }
    try {
      // Update state to starting
      this.changeState({
        isStarting: true,
        isSpeaking: false,
      })
      this.mic = mic
      this.resetBuffers()

      // Listen to the captured audio
      mic.on('Frames', this.onFrames)

      // Start speaking detection
      await this.vad.start(mic)
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

  stop = () => {
    this.changeState({
      isStarting: false,
      isStarted: false,
      isSpeaking: false,
    })

    try {
      // Stop listening to the captured audio
      this.mic?.off('Frames', this.onFrames)
      this.mic = undefined

      // Stop speaking detection
      this.vad.stop()
      this.vad.off('StartSpeaking', this.onStartSpeaking)
      this.vad.off('ConfirmSpeaking', this.onConfirmSpeaking)
      this.vad.off('CancelSpeaking', this.onCancelSpeaking)
      this.vad.off('StopSpeaking', this.onStopSpeaking)
    } catch (err) {
      console.error(err)
    }

    this.resetBuffers()
  }

  changeVad = (vadConfig: VADConfig) => {
    if (equalVADConfig(vadConfig, this.vadConfig)) return

    const mic = this.mic
    if (mic) {
      this.stop()
    }

    this.vadConfig = vadConfig
    this.vad = getVAD(vadConfig)

    if (mic) {
      this.start(mic)
    }
  }

  private onFrames = (frames: Float32Array, sampleRate: number) => {
    if (sampleRate !== this.sourceSampleRate) {
      // The device changed its mind about the sample rate, start over
      this.flushChunks()
      this.sourceSampleRate = sampleRate
      this.reserve = []
      this.reserveLength = 0
    }

    if (this.isRecording) {
      this.buffer.push(frames)
      this.bufferLength += frames.length
      this.flushChunks()
      return
    }

    // Keep the last moments of audio, the VAD needs some of them to make up
    // its mind and the beginning of the sentence lives there
    this.reserve.push(frames)
    this.reserveLength += frames.length
    const reserveMax = Math.round((this.vad.delay / 1000) * sampleRate)
    while (
      this.reserve.length > 1 &&
      this.reserveLength - this.reserve[0].length >= reserveMax
    ) {
      this.reserveLength -= this.reserve[0].length
      this.reserve.shift()
    }
  }

  private onStartSpeaking = () => {
    this.speakingConfirmed = false
    this.queuedChunks.length = 0

    // Start recording, from the reserve so nothing is cut off
    this.isRecording = true
    this.buffer = this.reserve
    this.bufferLength = this.reserveLength
    this.reserve = []
    this.reserveLength = 0
    this.flushChunks()
  }

  private onConfirmSpeaking = () => {
    this.speakingConfirmed = true
    this.changeState({ isSpeaking: true })
    this.emit('StartSpeaking')

    // Send what was recorded before the speech was confirmed
    for (const chunk of this.queuedChunks) {
      this.emit('Chunk', chunk)
    }
    this.queuedChunks.length = 0
  }

  private onCancelSpeaking = () => {
    // It was only noise, forget it
    this.stopRecording()
  }

  private onStopSpeaking = () => {
    const wasConfirmed = this.speakingConfirmed
    this.changeState({ isSpeaking: false })

    // Send the tail of the sentence before closing the turn
    if (wasConfirmed) {
      this.flushChunks(true)
    }
    this.stopRecording()
    this.emit('StopSpeaking')
  }

  private stopRecording() {
    this.isRecording = false
    this.speakingConfirmed = false
    this.queuedChunks.length = 0
    this.buffer = []
    this.bufferLength = 0
  }

  /**
   * Emits every complete chunk waiting in the buffer
   * @param final - Also emit the incomplete last chunk
   */
  private flushChunks(final = false) {
    const chunkLength = Math.round(
      (CHUNK_INTERVAL / 1000) * this.sourceSampleRate
    )

    if (this.bufferLength === 0) return
    if (this.bufferLength < chunkLength && !final) return

    const merged = concatFloat32(this.buffer)
    let offset = 0
    while (merged.length - offset >= chunkLength) {
      this.emitChunk(merged.subarray(offset, offset + chunkLength))
      offset += chunkLength
    }

    const rest = merged.subarray(offset)
    if (final && rest.length > 0) {
      this.emitChunk(rest)
      this.buffer = []
      this.bufferLength = 0
      return
    }
    this.buffer = rest.length ? [rest] : []
    this.bufferLength = rest.length
  }

  private emitChunk(samples: Float32Array) {
    const pcm = floatToPcm16(
      resample(samples, this.sourceSampleRate, SAMPLE_RATE)
    )

    if (!this.speakingConfirmed) {
      // Queue the chunk until speech is confirmed
      this.queuedChunks.push(pcm)
      return
    }

    this.emit('Chunk', pcm)
  }

  private resetBuffers() {
    this.isRecording = false
    this.speakingConfirmed = false
    this.reserve = []
    this.reserveLength = 0
    this.buffer = []
    this.bufferLength = 0
    this.queuedChunks.length = 0
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
