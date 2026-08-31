import assert from 'node:assert'
import { describe, it } from 'node:test'
import { FFT } from '../src/fft'

/** The definition of the transform, slow but beyond doubt */
function naiveDft(re: Float64Array, im: Float64Array) {
  const n = re.length
  const outRe = new Float64Array(n)
  const outIm = new Float64Array(n)
  for (let k = 0; k < n; k++) {
    for (let t = 0; t < n; t++) {
      const angle = (-2 * Math.PI * k * t) / n
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      outRe[k] += re[t] * cos - im[t] * sin
      outIm[k] += re[t] * sin + im[t] * cos
    }
  }
  return { outRe, outIm }
}

function randomSignal(n: number) {
  const re = new Float64Array(n)
  const im = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    re[i] = Math.sin(i / 3) + Math.cos(i / 7) * 0.5
    im[i] = 0
  }
  return { re, im }
}

describe('FFT', () => {
  it('matches the definition on a power of two', () => {
    const { re, im } = randomSignal(64)
    const expected = naiveDft(re, im)
    new FFT(64).transform(re, im)
    for (let i = 0; i < 64; i++) {
      assert.ok(Math.abs(re[i] - expected.outRe[i]) < 1e-9)
      assert.ok(Math.abs(im[i] - expected.outIm[i]) < 1e-9)
    }
  })

  it('matches the definition on the 400 points Whisper needs', () => {
    const { re, im } = randomSignal(400)
    const expected = naiveDft(re, im)
    new FFT(400).transform(re, im)
    for (let i = 0; i < 400; i++) {
      assert.ok(
        Math.abs(re[i] - expected.outRe[i]) < 1e-8,
        `real part of bin ${i}: ${re[i]} against ${expected.outRe[i]}`
      )
      assert.ok(Math.abs(im[i] - expected.outIm[i]) < 1e-8)
    }
  })

  it('finds the frequency of a pure tone', () => {
    const n = 400
    const re = new Float64Array(n)
    const im = new Float64Array(n)
    // Ten periods over the window lands exactly on bin ten
    for (let i = 0; i < n; i++) re[i] = Math.cos((2 * Math.PI * 10 * i) / n)
    new FFT(n).transform(re, im)
    const magnitudes = Array.from({ length: n / 2 }, (_, k) =>
      Math.hypot(re[k], im[k])
    )
    const loudest = magnitudes.indexOf(Math.max(...magnitudes))
    assert.equal(loudest, 10)
  })
})
