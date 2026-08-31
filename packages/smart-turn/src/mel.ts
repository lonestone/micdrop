import { FFT } from './fft'

/** Rate the model was trained on */
export const SAMPLE_RATE = 16000
/** How much audio the model looks at */
export const WINDOW_SECONDS = 8
export const WINDOW_SAMPLES = SAMPLE_RATE * WINDOW_SECONDS // 128000
/** Length of one transform, 25 ms */
export const FRAME_SAMPLES = 400
/** Distance between two transforms, 10 ms */
export const HOP_SAMPLES = 160
export const MEL_BANDS = 80
export const MEL_FRAMES = WINDOW_SAMPLES / HOP_SAMPLES // 800

/** The value a band of pure digital silence lands on, before scaling */
export const SILENT_BAND = Math.log10(1e-30)

/**
 * How far below the loudest moment of a turn a frame still counts as sound.
 *
 * Three decades of power, thirty decibels, which separates a voice from the
 * room it is spoken in without cutting the quiet end of a sentence.
 */
export const SOUND_RANGE = 3

/**
 * How much silence is left at the end of a turn.
 *
 * The model was trained on recordings that stop shortly after the last word,
 * so it reads a long silence as a sentence that has landed. A voice detector
 * needs half a second of silence to call a turn over, and handing that silence
 * to the model would undo the very hesitation it is there to catch.
 */
export const TAIL_FRAMES = 20 // 200 ms

/** How much trailing silence can be cut away, in frames */
export const TRIM_FRAMES = 200 // 2 s

/** Floor the reference applies to the scaled spectrum */
export const POWER_FLOOR = Math.log10(1e-10)

const hertzToMel = (hertz: number) =>
  hertz >= 1000
    ? 15 + Math.log(hertz / 1000) * (27 / Math.log(6.4))
    : (3 * hertz) / 200

const melToHertz = (mel: number) =>
  mel >= 15 ? 1000 * Math.exp((Math.log(6.4) / 27) * (mel - 15)) : (200 * mel) / 3

export interface MelBand {
  /** First frequency bin the triangle covers */
  start: number
  /** Weight of each covered bin */
  weights: Float64Array
}

/**
 * Slaney mel filter bank, the one Whisper was trained with.
 *
 * Each triangle only covers a handful of bins, so only those are kept: the
 * dense form would multiply eighty rows of two hundred numbers per frame.
 */
export function melFilterBank(): MelBand[] {
  const bins = FRAME_SAMPLES / 2 + 1
  const melMax = hertzToMel(8000)
  const edges = new Float64Array(MEL_BANDS + 2)
  for (let i = 0; i < MEL_BANDS + 2; i++) {
    edges[i] = melToHertz((melMax * i) / (MEL_BANDS + 1))
  }
  const binFrequencies = new Float64Array(bins)
  for (let i = 0; i < bins; i++) binFrequencies[i] = (8000 * i) / (bins - 1)

  const bands: MelBand[] = []
  for (let band = 0; band < MEL_BANDS; band++) {
    const left = edges[band]
    const center = edges[band + 1]
    const right = edges[band + 2]
    const normalisation = 2 / (right - left)
    const weights: number[] = []
    let start = -1
    for (let bin = 0; bin < bins; bin++) {
      const rising = (binFrequencies[bin] - left) / (center - left)
      const falling = (right - binFrequencies[bin]) / (right - center)
      const value = Math.min(rising, falling)
      if (value > 0) {
        if (start < 0) start = bin
        weights.push(value * normalisation)
      } else if (start >= 0) {
        break
      }
    }
    bands.push({
      start: start < 0 ? 0 : start,
      weights: Float64Array.from(weights),
    })
  }
  return bands
}

/** Periodic Hann window, matching `window_function(400, "hann")` */
export function hannWindow(): Float64Array {
  const window = new Float64Array(FRAME_SAMPLES)
  for (let i = 0; i < FRAME_SAMPLES; i++) {
    window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / FRAME_SAMPLES)
  }
  return window
}

/**
 * Scores one frame of audio into the eighty mel bands, as base ten logarithms
 * of power. The scaling that depends on the whole window is applied later.
 */
export class MelFrameScorer {
  private readonly fft = new FFT(FRAME_SAMPLES)
  private readonly window = hannWindow()
  private readonly bands = melFilterBank()
  private readonly re = new Float64Array(FRAME_SAMPLES)
  private readonly im = new Float64Array(FRAME_SAMPLES)
  private readonly power = new Float64Array(FRAME_SAMPLES / 2 + 1)

  /**
   * @param read - Gives the sample at position `index` of the frame
   * @param output - Where the bands are written
   * @param stride - Distance between two bands in `output`
   * @param offset - Position of this frame inside `output`
   */
  score(
    read: (index: number) => number,
    output: Float64Array,
    stride: number,
    offset: number
  ) {
    const { re, im, window, bands, power, fft } = this
    for (let i = 0; i < FRAME_SAMPLES; i++) {
      re[i] = read(i) * window[i]
      im[i] = 0
    }
    fft.transform(re, im)

    const bins = FRAME_SAMPLES / 2 + 1
    for (let bin = 0; bin < bins; bin++) {
      power[bin] = re[bin] * re[bin] + im[bin] * im[bin]
    }

    for (let band = 0; band < MEL_BANDS; band++) {
      const { start, weights } = bands[band]
      let sum = 0
      for (let i = 0; i < weights.length; i++) sum += weights[i] * power[start + i]
      output[band * stride + offset] = Math.log10(Math.max(sum, 1e-30))
    }
  }
}

/**
 * Turns the mel logarithms into what the model expects.
 *
 * The reference scales the waveform to zero mean and unit variance before the
 * transform. Scaling the samples by a constant scales the spectrum by its
 * square, which is a constant shift once everything is in logarithms, so the
 * shift can be applied here instead of before the transform.
 *
 * @param bands - MEL_BANDS x MEL_FRAMES logarithms, oldest frame first
 * @param loudness - Standard deviation of the window, before scaling
 * @param output - Where the features are written
 */
export function normaliseBands(
  bands: Float64Array,
  loudness: number,
  output: Float32Array
) {
  const shift = -2 * Math.log10(loudness)
  let max = -Infinity
  for (let i = 0; i < bands.length; i++) {
    const value = Math.max(bands[i] + shift, POWER_FLOOR)
    output[i] = value
    if (value > max) max = value
  }
  // Anything more than eight decades below the loudest band carries no signal
  const floor = max - 8
  for (let i = 0; i < output.length; i++) {
    output[i] = (Math.max(output[i], floor) + 4) / 4
  }
}
