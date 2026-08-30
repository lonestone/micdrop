import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  concatFloat32,
  floatToPcm16,
  pcm16ToArrayBuffer,
  pcm16ToFloat,
  resample,
} from '../src/audio/pcm'
import { sine } from './fakes'

describe('resample', () => {
  it('leaves the samples alone when both rates match', () => {
    const input = new Float32Array([0, 0.5, -0.5, 1])
    assert.equal(resample(input, 16000, 16000), input)
  })

  it('halves the length when halving the rate', () => {
    const input = new Float32Array([0, 1, 0, -1, 0, 1, 0, -1])
    const output = resample(input, 48000, 24000)
    assert.equal(output.length, 4)
  })

  it('triples the length when tripling the rate', () => {
    const input = new Float32Array([0, 1, 0])
    assert.equal(resample(input, 16000, 48000).length, 9)
  })

  it('interpolates between two samples', () => {
    const output = resample(new Float32Array([0, 1]), 1000, 2000)
    assert.equal(output.length, 4)
    assert.ok(Math.abs(output[0] - 0) < 1e-6)
    assert.ok(Math.abs(output[1] - 0.5) < 1e-6)
  })

  it('keeps a sine recognizable through a downsample', () => {
    const input = sine(0.1, { frequency: 200, sampleRate: 48000 })
    const output = resample(input, 48000, 16000)
    assert.equal(output.length, 1600)
    // Amplitude survives, so the wave was not mangled
    assert.ok(Math.max(...output) > 0.45)
    assert.ok(Math.min(...output) < -0.45)
  })
})

describe('floatToPcm16', () => {
  it('maps the full scale to the full range', () => {
    const pcm = floatToPcm16(new Float32Array([-1, 0, 1]))
    assert.deepEqual(Array.from(pcm), [-32768, 0, 32767])
  })

  it('clips whatever goes beyond the full scale', () => {
    const pcm = floatToPcm16(new Float32Array([-2, 2]))
    assert.deepEqual(Array.from(pcm), [-32768, 32767])
  })

  it('survives a round trip', () => {
    const input = sine(0.01)
    const output = pcm16ToFloat(floatToPcm16(input))
    for (let i = 0; i < input.length; i++) {
      assert.ok(Math.abs(input[i] - output[i]) < 1e-4)
    }
  })
})

describe('concatFloat32', () => {
  it('returns the only chunk untouched', () => {
    const chunk = new Float32Array([1, 2])
    assert.equal(concatFloat32([chunk]), chunk)
  })

  it('joins the chunks in order', () => {
    const output = concatFloat32([
      new Float32Array([1, 2]),
      new Float32Array([3]),
      new Float32Array([4, 5]),
    ])
    assert.deepEqual(Array.from(output), [1, 2, 3, 4, 5])
  })
})

describe('pcm16ToArrayBuffer', () => {
  it('sends only the samples of a view, not the whole buffer', () => {
    const full = new Int16Array([1, 2, 3, 4, 5, 6])
    const view = full.subarray(2, 4)
    const buffer = pcm16ToArrayBuffer(view)
    assert.equal(buffer.byteLength, 4)
    assert.deepEqual(Array.from(new Int16Array(buffer)), [3, 4])
  })
})
