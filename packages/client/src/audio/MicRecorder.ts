import { EventEmitter } from 'eventemitter3'
import { concatFloat32, floatToPcm16, resample } from './pcm'
import { TurnDetector } from '../types'
import { MicSource } from './types'
import { equalVADConfig, getVAD, VADConfig } from './vad/getVAD'
import { VAD } from './vad/VAD'

const SAMPLE_RATE = 16000
const CHUNK_INTERVAL = 100 // ms

/**
 * How long a turn may stay open after the detector asked to wait.
 *
 * Long enough to cover the pause of someone looking for their words, and short
 * enough that a wrong verdict costs one awkward silence rather than the call.
 */
export const DEFAULT_TURN_MAX_WAIT = 4000 // ms

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
 *
 * Recording and the turn are two different things. The VAD decides what is
 * worth sending, so the silences stay out of the stream either way. A
 * {@link TurnDetector}, when there is one, decides when the turn is over, and
 * a pause the speaker is about to fill leaves it open.
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

  // The turn is open between the first confirmed word and the moment the
  // server is told to answer, which can span several pauses
  private turnOpen = false
  private turnListening = false
  private turnTimer: ReturnType<typeof setTimeout> | undefined
  // Bumped whenever the turn moves on, so a late answer is dropped
  private turnRound = 0

  constructor(
    private vadConfig?: VADConfig,
    private turnDetector?: TurnDetector,
    /**
     * How long a turn stays open once the detector asked to wait.
     *
     * The way out of a detector that hears an unfinished sentence where there
     * is none: the speaker who never comes back still gets an answer.
     */
    public turnMaxWait = DEFAULT_TURN_MAX_WAIT
  ) {
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
    this.cancelPendingClose()

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

  /**
   * Changes what decides when a turn is over
   * @param turnDetector - The new detector, or nothing to leave it to the VAD
   */
  changeTurnDetector = (turnDetector?: TurnDetector) => {
    if (turnDetector === this.turnDetector) return
    // A turn opened under the previous detector has to end somewhere
    if (this.turnOpen) {
      this.endTurn()
    }
    this.turnDetector = turnDetector
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
    // The detector hears the turn as it was spoken, pauses included, where the
    // stream sent to the server has the silences cut out of it
    if (this.turnListening) {
      this.turnDetector?.push(frames, sampleRate)
    }

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

    // A new turn starts on the reserve too, so the model hears the first
    // syllable. An open turn keeps the audio it already has.
    if (this.turnDetector && !this.turnListening) {
      this.turnDetector.reset()
      this.turnListening = true
      for (const frames of this.buffer) {
        this.turnDetector.push(frames, this.sourceSampleRate)
      }
    }

    this.flushChunks()
  }

  private onConfirmSpeaking = () => {
    this.speakingConfirmed = true
    this.changeState({ isSpeaking: true })

    // The speaker picked their sentence back up, so the turn they had left
    // open carries on and the server keeps the same stream
    this.cancelPendingClose()
    if (!this.turnOpen) {
      this.turnOpen = true
      this.emit('StartSpeaking')
    }

    // Send what was recorded before the speech was confirmed
    for (const chunk of this.queuedChunks) {
      this.emit('Chunk', chunk)
    }
    this.queuedChunks.length = 0
  }

  private onCancelSpeaking = () => {
    // It was only noise, forget it. A turn already open keeps waiting, and
    // keeps whatever timer it was running.
    this.stopRecording()
    if (!this.turnOpen) {
      this.turnListening = false
    }
  }

  private onStopSpeaking = () => {
    const wasConfirmed = this.speakingConfirmed
    this.changeState({ isSpeaking: false })

    // Send the tail of the sentence before closing the turn
    if (wasConfirmed) {
      this.flushChunks(true)
    }
    this.stopRecording()
    this.closeTurn()
  }

  /**
   * Ends the turn, unless the detector hears an unfinished sentence.
   *
   * A microphone that is no longer listening ends it straight away: a muted or
   * paused call has nothing more to say, whatever the sentence sounded like.
   */
  private async closeTurn() {
    if (
      !this.turnDetector ||
      !this.turnOpen ||
      !this.vad.isStarted ||
      this.vad.isPaused
    ) {
      this.endTurn()
      return
    }

    const round = this.turnRound
    try {
      const { complete } = await this.turnDetector.predict()
      // The speaker started again, or the call moved on, while it was thinking
      if (round !== this.turnRound) return
      if (complete) {
        this.endTurn()
        return
      }
    } catch (error) {
      console.error('[Micdrop] Turn detection failed', error)
      this.endTurn()
      return
    }

    // Leave the turn open, and close it if the sentence never comes back
    this.cancelPendingClose()
    this.turnTimer = setTimeout(() => {
      this.turnTimer = undefined
      this.endTurn()
    }, this.turnMaxWait)
  }

  private endTurn() {
    this.cancelPendingClose()
    this.turnOpen = false
    this.turnListening = false
    this.emit('StopSpeaking')
  }

  /** Drops the pending close, both the timer and the answer still owed */
  private cancelPendingClose() {
    this.turnRound++
    if (this.turnTimer) {
      clearTimeout(this.turnTimer)
      this.turnTimer = undefined
    }
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
    this.turnOpen = false
    this.turnListening = false
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
