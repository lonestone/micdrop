import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { getVolume, VolumeMeter } from '../src/audio/volume'
import { sine } from './fakes'

/** Deterministic broadband noise, the sound of a room or of a fan */
function noise(length: number, amplitude: number): Float32Array {
  const samples = new Float32Array(length)
  let seed = 42
  for (let i = 0; i < length; i++) {
    seed = (seed * 1103515245 + 12345) % 2147483648
    samples[i] = (seed / 2147483648 - 0.5) * 2 * amplitude
  }
  return samples
}

/**
 * The same measurement written the slow, obvious way: a plain discrete Fourier
 * transform. It says what the fast one should answer.
 */
function referenceVolume(samples: Float32Array): number {
  const N = 512
  const window = new Float32Array(N)
  for (let i = 0; i < N; i++) {
    const a = (2 * Math.PI * i) / (N - 1)
    window[i] = 0.42 - 0.5 * Math.cos(a) + 0.08 * Math.cos(2 * a)
  }
  const offset = Math.max(0, samples.length - N)
  let loudest = -Infinity
  for (let k = 4; k < N / 2; k++) {
    let real = 0
    let imaginary = 0
    for (let n = 0; n < N; n++) {
      const value = (samples[offset + n] ?? 0) * window[n]
      const angle = (-2 * Math.PI * k * n) / N
      real += value * Math.cos(angle)
      imaginary += value * Math.sin(angle)
    }
    const magnitude = Math.sqrt(real * real + imaginary * imaginary) / N
    const decibels = magnitude === 0 ? -Infinity : 20 * Math.log10(magnitude)
    if (decibels > loudest && decibels < 0) loudest = decibels
  }
  return loudest
}

describe('VolumeMeter', () => {
  it('agrees with a plain Fourier transform', () => {
    for (const signal of [
      sine(0.1, { amplitude: 0.5, frequency: 220 }),
      sine(0.1, { amplitude: 0.05, frequency: 1000 }),
      noise(1600, 0.05),
    ]) {
      const fast = getVolume(signal)
      const slow = referenceVolume(signal)
      assert.ok(
        Math.abs(fast - slow) < 0.01,
        `${fast.toFixed(3)} vs ${slow.toFixed(3)}`
      )
    }
  })

  it('reports silence as minus infinity', () => {
    assert.equal(getVolume(new Float32Array(1600)), -Infinity)
    assert.equal(getVolume(new Float32Array(0)), -Infinity)
  })

  it('follows the amplitude, 20 dB per factor of ten', () => {
    const loud = getVolume(sine(0.1, { amplitude: 0.5 }))
    const quiet = getVolume(sine(0.1, { amplitude: 0.05 }))
    assert.ok(Math.abs(loud - quiet - 20) < 0.1, `${loud} vs ${quiet}`)
  })

  it('tells a voice from a room of the same loudness', () => {
    // This is why the level is the loudest frequency rather than the overall
    // energy: a voice concentrates its power, a room spreads it out
    const voice = getVolume(sine(0.1, { amplitude: 0.05, frequency: 200 }))
    const room = getVolume(noise(1600, 0.05))

    assert.ok(
      voice > room + 10,
      `a voice at ${voice.toFixed(1)} should stand out of a room at ${room.toFixed(1)}`
    )
    assert.ok(room < -55, 'and the room stays under the speech threshold')
    assert.ok(voice > -55, 'while the voice goes over it')
  })

  it('puts real speech well over the threshold', () => {
    // Levels measured on the sample files of the repository
    for (const amplitude of [0.02, 0.1, 0.5]) {
      const level = getVolume(sine(0.1, { amplitude, frequency: 180 }))
      assert.ok(level > -55, `${amplitude} measured at ${level.toFixed(1)}`)
    }
  })

  it('fades out instead of cutting off', () => {
    const meter = new VolumeMeter()
    const loud = meter.measure(sine(0.1, { amplitude: 0.3 }))
    const silence = new Float32Array(1600)

    const first = meter.measure(silence)
    const second = meter.measure(silence)
    assert.ok(first < loud - 15, 'it falls right away')
    assert.ok(second < first - 15, 'and keeps falling')
    assert.ok(second < -55, 'below the speech threshold within two windows')
  })

  it('forgets the previous call once reset', () => {
    const meter = new VolumeMeter()
    meter.measure(sine(0.1, { amplitude: 0.5 }))
    meter.reset()
    assert.equal(meter.measure(new Float32Array(1600)), -Infinity)
  })
})
