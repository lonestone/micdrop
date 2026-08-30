import { SILERO_SAMPLE_RATE, SileroModel } from '@micdrop/client'
import { InferenceSession, Tensor } from 'onnxruntime-react-native'

/** Where the model is fetched from, when the app does not provide it */
export const DEFAULT_SILERO_MODEL_URL =
  'https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.30/dist/silero_vad_v5.onnx'

export interface OnnxSileroOptions {
  /**
   * Where the Silero v5 model comes from: an address to fetch it from, a file
   * already on the device, or its bytes.
   */
  model?: string | Uint8Array
}

// Two megabytes, fetched once and kept for as long as the app runs
let loading: Promise<Uint8Array> | undefined

/**
 * Runs the Silero model on a phone, on the native ONNX runtime.
 *
 * The state machine that turns its answers into turns lives in
 * `@micdrop/client`, this only scores windows of audio.
 */
export class OnnxSileroModel implements SileroModel {
  private session: InferenceSession | undefined
  private state: Tensor
  private sampleRate: Tensor

  constructor(private options: OnnxSileroOptions = {}) {
    this.state = newState()
    this.sampleRate = new Tensor('int64', [BigInt(SILERO_SAMPLE_RATE)])
  }

  async load() {
    if (this.session) return

    const source = this.options.model ?? DEFAULT_SILERO_MODEL_URL

    if (typeof source === 'string' && !source.startsWith('http')) {
      // A file already on the device, the runtime reads it itself
      this.session = await InferenceSession.create(source)
      return
    }

    if (typeof source === 'string') {
      loading = loading ?? fetchModel(source)
      this.session = await InferenceSession.create(await loading)
      return
    }

    this.session = await InferenceSession.create(source)
  }

  async process(frame: Float32Array): Promise<number> {
    if (!this.session) await this.load()

    const output = await this.session!.run({
      input: new Tensor('float32', frame, [1, frame.length]),
      state: this.state,
      sr: this.sampleRate,
    })

    this.state = output.stateN as Tensor
    return (output.output.data as Float32Array)[0]
  }

  reset() {
    this.state = newState()
  }

  async release() {
    await this.session?.release()
    this.session = undefined
  }
}

async function fetchModel(url: string): Promise<Uint8Array> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Could not load the Silero model from ${url}`)
  }
  return new Uint8Array(await response.arrayBuffer())
}

/** The memory the model carries from one window to the next, emptied */
function newState(): Tensor {
  return new Tensor('float32', new Float32Array(2 * 128), [2, 1, 128])
}
