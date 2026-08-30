/**
 * Measures how loud the microphone is, the way a browser AnalyserNode does.
 *
 * The level is the loudest frequency bin rather than the overall energy: a
 * voice concentrates its power in a few bins while a fan or a room spreads it
 * over all of them, so the two are told apart by about 25 dB instead of the 7 dB
 * an RMS would give.
 *
 * Everything here is pure, so the same measurement runs in a browser, on a
 * phone and in the test suite.
 */

const FFT_SIZE = 512
const BIN_COUNT = FFT_SIZE / 2
// Bins below about 125 Hz hold rumble and handling noise rather than speech
const FIRST_BIN = 4
// How much of the previous measurement is kept, as an AnalyserNode does with
// its default smoothingTimeConstant
const SMOOTHING = 0.1

/** Sample rate the measurement expects, so a bin means the same frequency everywhere */
export const VOLUME_SAMPLE_RATE = 16000

// Blackman window, the one the Web Audio API applies before its FFT
const WINDOW = new Float32Array(FFT_SIZE)
for (let i = 0; i < FFT_SIZE; i++) {
  const a = (2 * Math.PI * i) / (FFT_SIZE - 1)
  WINDOW[i] = 0.42 - 0.5 * Math.cos(a) + 0.08 * Math.cos(2 * a)
}

// Reversed indexes and twiddle factors, computed once
const REVERSED = new Uint16Array(FFT_SIZE)
for (let i = 0; i < FFT_SIZE; i++) {
  let reversed = 0
  for (let bit = 1; bit < FFT_SIZE; bit <<= 1) {
    reversed = (reversed << 1) | (i & bit ? 1 : 0)
  }
  REVERSED[i] = reversed
}
const COS = new Float32Array(FFT_SIZE / 2)
const SIN = new Float32Array(FFT_SIZE / 2)
for (let i = 0; i < FFT_SIZE / 2; i++) {
  COS[i] = Math.cos((-2 * Math.PI * i) / FFT_SIZE)
  SIN[i] = Math.sin((-2 * Math.PI * i) / FFT_SIZE)
}

/**
 * Follows the level of a stream of audio.
 *
 * It keeps the previous measurement, so a single quiet frame in the middle of a
 * word does not read as a pause.
 */
export class VolumeMeter {
  private real = new Float32Array(FFT_SIZE)
  private imaginary = new Float32Array(FFT_SIZE)
  private magnitudes = new Float32Array(BIN_COUNT)
  private smoothed = new Float32Array(BIN_COUNT)
  private hasPrevious = false

  /**
   * Measures a window of audio
   * @param samples - At least 512 mono samples at 16 kHz, in the -1..1 range.
   *   Only the last 512 are looked at.
   * @returns The level in decibels, between -Infinity (silence) and 0
   */
  measure(samples: Float32Array): number {
    if (samples.length === 0) return -Infinity

    const offset = Math.max(0, samples.length - FFT_SIZE)
    const { real, imaginary } = this

    // Window the samples into the FFT input, in bit reversed order
    for (let i = 0; i < FFT_SIZE; i++) {
      const sample = offset + i < samples.length ? samples[offset + i] : 0
      real[REVERSED[i]] = sample * WINDOW[i]
      imaginary[REVERSED[i]] = 0
    }

    // Cooley-Tukey, in place
    for (let size = 2; size <= FFT_SIZE; size <<= 1) {
      const half = size >> 1
      const step = FFT_SIZE / size
      for (let start = 0; start < FFT_SIZE; start += size) {
        for (let i = 0; i < half; i++) {
          const even = start + i
          const odd = even + half
          const cos = COS[i * step]
          const sin = SIN[i * step]
          const realOdd = real[odd] * cos - imaginary[odd] * sin
          const imaginaryOdd = real[odd] * sin + imaginary[odd] * cos
          real[odd] = real[even] - realOdd
          imaginary[odd] = imaginary[even] - imaginaryOdd
          real[even] += realOdd
          imaginary[even] += imaginaryOdd
        }
      }
    }

    // Magnitudes, normalized the way the Web Audio API normalizes them
    for (let k = 0; k < BIN_COUNT; k++) {
      this.magnitudes[k] =
        Math.sqrt(real[k] * real[k] + imaginary[k] * imaginary[k]) / FFT_SIZE
    }

    // Blend with the previous window
    if (this.hasPrevious) {
      for (let k = 0; k < BIN_COUNT; k++) {
        this.smoothed[k] =
          SMOOTHING * this.smoothed[k] + (1 - SMOOTHING) * this.magnitudes[k]
      }
    } else {
      this.smoothed.set(this.magnitudes)
      this.hasPrevious = true
    }

    // Loudest bin, ignoring the ones that hold rumble
    let loudest = -Infinity
    for (let k = FIRST_BIN; k < BIN_COUNT; k++) {
      const magnitude = this.smoothed[k]
      if (magnitude === 0) continue
      const decibels = 20 * Math.log10(magnitude)
      if (decibels > loudest && decibels < 0) loudest = decibels
    }
    return loudest
  }

  /** Forgets the previous window, for when capture stops and starts again */
  reset() {
    this.hasPrevious = false
    this.smoothed.fill(0)
  }
}

/**
 * Measures one window of audio, without following what came before
 * @param samples - Mono samples at 16 kHz, in the -1..1 range
 * @returns The level in decibels, between -Infinity (silence) and 0
 */
export function getVolume(samples: Float32Array): number {
  return new VolumeMeter().measure(samples)
}
