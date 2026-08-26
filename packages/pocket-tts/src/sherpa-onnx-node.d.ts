/**
 * The part of the sherpa-onnx Node addon this package uses.
 *
 * sherpa-onnx-node ships its API as JSDoc typedefs rather than declarations,
 * so the shapes we pass and read are declared here.
 *
 * @see https://k2-fsa.github.io/sherpa/onnx/tts/pocket.html
 */
declare module 'sherpa-onnx-node' {
  export interface Wave {
    samples: Float32Array
    sampleRate: number
  }

  export interface PocketModelConfig {
    lmFlow: string
    lmMain: string
    encoder: string
    decoder: string
    textConditioner: string
    vocabJson: string
    tokenScoresJson: string
    voiceEmbeddingCacheCapacity?: number
  }

  export interface OfflineTtsConfig {
    model: {
      pocket?: PocketModelConfig
      debug?: boolean
      numThreads?: number
      provider?: string
    }
    maxNumSentences?: number
  }

  export interface GenerationOptions {
    speed?: number
    numSteps?: number
    referenceAudio?: Float32Array
    referenceSampleRate?: number
    extra?: Record<string, number | string>
  }

  export class GenerationConfig {
    constructor(options: GenerationOptions)
  }

  export interface TtsRequest {
    text: string
    enableExternalBuffer?: boolean
    generationConfig?: GenerationConfig
    /** Returning 0 stops the generation, 1 continues it. */
    onProgress?: (info: { samples: Float32Array; progress: number }) => number
  }

  export class OfflineTts {
    constructor(config: OfflineTtsConfig)
    static createAsync(config: OfflineTtsConfig): Promise<OfflineTts>
    readonly sampleRate: number
    readonly numSpeakers: number
    generate(request: TtsRequest): Wave
    generateAsync(request: TtsRequest): Promise<Wave>
  }

  export function readWave(filename: string): Wave

  /**
   * The addon is a CommonJS module exporting one object, which is what both
   * the CommonJS and the ESM builds of this package end up importing.
   */
  const sherpa: {
    OfflineTts: typeof OfflineTts
    GenerationConfig: typeof GenerationConfig
    readWave: typeof readWave
  }
  export default sherpa
}
