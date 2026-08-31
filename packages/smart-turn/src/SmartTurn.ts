import { extractFeatures, TurnFeatures } from './features'
import { loadSmartTurnModel, SmartTurnModel } from './model'
import { SAMPLE_RATE } from './mel'

export interface SmartTurnOptions {
  /**
   * Above this probability the turn counts as finished.
   *
   * The reference value of the model, which its own benchmarks are measured
   * at. Anything between 0.3 and 0.7 scores within half a point of it, so
   * move it only to lean deliberately: lower to answer sooner and cut people
   * off more often, higher to let hesitations run longer.
   */
  threshold?: number

  /** A model that is already loaded, instead of the one this platform registers */
  model?: SmartTurnModel
}

export interface SmartTurnResult {
  /** Probability that the speaker has finished, between 0 and 1 */
  probability: number
  /** Whether that probability clears the threshold */
  complete: boolean
  /** How long the model took to answer, in milliseconds */
  duration: number
}

/** What a `SmartTurn` starts with, and what `resetOptions` puts back */
export const DEFAULT_SMART_TURN_OPTIONS = {
  threshold: 0.5,
}

/**
 * Tells whether a speaker has finished their turn, from the sound of it.
 *
 * A voice activity detector hears whether someone is speaking right now. This
 * hears whether the sentence has landed, so an agent can answer as soon as a
 * question is over and keep waiting through a hesitation.
 *
 * Feed it the audio of the turn as it comes, then ask when the speaker pauses:
 *
 * ```ts
 * import { SmartTurn } from '@micdrop/smart-turn'
 * import '@micdrop/smart-turn/web'
 *
 * const smartTurn = new SmartTurn()
 * // ... on every chunk of microphone audio
 * smartTurn.push(samples, 48000)
 * // ... when the voice activity detector hears a pause
 * const { complete } = await smartTurn.predict()
 * ```
 *
 * @see https://huggingface.co/pipecat-ai/smart-turn-v3
 */
export class SmartTurn {
  public options: Required<Omit<SmartTurnOptions, 'model'>>

  private features = new TurnFeatures()
  private model: SmartTurnModel | undefined
  private loading: Promise<SmartTurnModel> | undefined

  constructor(options: SmartTurnOptions = {}) {
    const { model, ...rest } = options
    this.options = { ...DEFAULT_SMART_TURN_OPTIONS, ...rest }
    this.model = model
  }

  /**
   * Changes some of the options, leaving the others alone
   * @param options - The options to change
   */
  setOptions(options: Partial<Omit<SmartTurnOptions, 'model'>>) {
    this.options = { ...this.options, ...options }
  }

  /** Puts every option back to what it started with */
  resetOptions() {
    this.options = { ...DEFAULT_SMART_TURN_OPTIONS }
  }

  /** How much of the current turn the model will look at, in seconds */
  get seconds(): number {
    return this.features.seconds
  }

  /**
   * Loads the model ahead of time, so the first turn is as quick as the rest
   */
  async load(): Promise<void> {
    await this.getModel()
  }

  /**
   * Feeds the audio captured since the last call
   * @param samples - Mono samples, in the -1..1 range
   * @param sampleRate - Rate of `samples`, resampled to 16 kHz when it differs
   */
  push(samples: Float32Array, sampleRate = SAMPLE_RATE) {
    this.features.push(
      sampleRate === SAMPLE_RATE ? samples : resample(samples, sampleRate)
    )
  }

  /** Starts a new turn, forgetting the previous one */
  reset() {
    this.features.reset()
  }

  /**
   * Asks whether the turn that was pushed so far is finished
   */
  async predict(): Promise<SmartTurnResult> {
    return this.run(this.features.read())
  }

  /**
   * Asks about a turn that is already in memory, without pushing it first
   * @param samples - Mono samples of the whole turn
   * @param sampleRate - Rate of `samples`, resampled to 16 kHz when it differs
   */
  async predictOnce(
    samples: Float32Array,
    sampleRate = SAMPLE_RATE
  ): Promise<SmartTurnResult> {
    const audio =
      sampleRate === SAMPLE_RATE ? samples : resample(samples, sampleRate)
    return this.run(extractFeatures(audio))
  }

  /** Releases the runtime, and with it the memory the model holds */
  async release(): Promise<void> {
    const model = this.model
    this.model = undefined
    this.loading = undefined
    await model?.release()
  }

  private async run(features: Float32Array): Promise<SmartTurnResult> {
    const model = await this.getModel()
    const start = Date.now()
    const probability = await model.predict(features)
    return {
      probability,
      complete: probability > this.options.threshold,
      duration: Date.now() - start,
    }
  }

  private async getModel(): Promise<SmartTurnModel> {
    if (this.model) return this.model
    // Several turns may ask at once while the model is still downloading
    this.loading = this.loading ?? loadSmartTurnModel()
    this.model = await this.loading
    return this.model
  }
}

/** Resamples mono float samples to 16 kHz with linear interpolation */
function resample(input: Float32Array, inputRate: number): Float32Array {
  if (input.length === 0) return input
  const ratio = inputRate / SAMPLE_RATE
  const length = Math.round(input.length / ratio)
  const output = new Float32Array(length)
  for (let i = 0; i < length; i++) {
    const position = i * ratio
    const index = Math.floor(position)
    const next = Math.min(index + 1, input.length - 1)
    const fraction = position - index
    output[i] = input[index] * (1 - fraction) + input[next] * fraction
  }
  return output
}
