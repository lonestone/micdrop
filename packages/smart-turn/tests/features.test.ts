import assert from 'node:assert'
import { describe, it } from 'node:test'
import { extractFeatures, TurnFeatures } from '../src/features'
import {
  melFilterBank,
  MEL_BANDS,
  MEL_FRAMES,
  SAMPLE_RATE,
  WINDOW_SAMPLES,
} from '../src/mel'

/** A voice like signal: a moving pitch with a couple of harmonics */
function speechLike(seconds: number, seed = 1) {
  const samples = new Float32Array(Math.round(seconds * SAMPLE_RATE))
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE
    const pitch = 120 + 40 * Math.sin(2 * Math.PI * 0.7 * t * seed)
    const envelope = 0.4 * (1 + Math.sin(2 * Math.PI * 2.3 * t))
    samples[i] =
      envelope *
      (Math.sin(2 * Math.PI * pitch * t) +
        0.5 * Math.sin(4 * Math.PI * pitch * t) +
        0.25 * Math.sin(6 * Math.PI * pitch * t)) *
      0.2
  }
  return samples
}

function push(features: TurnFeatures, samples: Float32Array, chunk = 1600) {
  for (let i = 0; i < samples.length; i += chunk) {
    features.push(samples.subarray(i, Math.min(i + chunk, samples.length)))
  }
}

describe('mel filter bank', () => {
  it('covers the eighty bands in rising order', () => {
    const bands = melFilterBank()
    assert.equal(bands.length, MEL_BANDS)
    for (let i = 1; i < bands.length; i++) {
      assert.ok(bands[i].start >= bands[i - 1].start)
    }
    for (const band of bands) {
      assert.ok(band.weights.length > 0)
      assert.ok(band.weights.every((weight) => weight > 0))
    }
  })

  it('stays sparse, so a frame costs little', () => {
    const covered = melFilterBank().reduce(
      (total, band) => total + band.weights.length,
      0
    )
    assert.ok(covered < MEL_BANDS * 20, `covered ${covered} bins`)
  })
})

describe('extractFeatures', () => {
  it('returns one value per band and per frame', () => {
    const features = extractFeatures(speechLike(3))
    assert.equal(features.length, MEL_BANDS * MEL_FRAMES)
    assert.ok(features.every(Number.isFinite))
  })

  it('spans exactly the two decades the model reads', () => {
    // Everything more than eight decades below the loudest band is flattened,
    // and the result is divided by four, so the span cannot exceed two
    const features = extractFeatures(speechLike(6))
    const min = Math.min(...features)
    const max = Math.max(...features)
    assert.ok(max - min <= 2 + 1e-6, `span ${max - min}`)
    assert.ok(max - min > 1.5, `span ${max - min}, too flat to carry speech`)
  })

  it('reads silence as a flat floor', () => {
    const features = extractFeatures(new Float32Array(SAMPLE_RATE))
    const first = features[0]
    assert.ok(features.every((value) => Math.abs(value - first) < 1e-3))
  })

  it('places a short turn at the end of the window', () => {
    // One second of speech leaves seven seconds of silence in front of it
    const features = extractFeatures(speechLike(1))
    const silentFrames = MEL_FRAMES - Math.round(SAMPLE_RATE / 160)
    // A low band, where a voice puts most of its energy
    const band = 2
    const early = features[band * MEL_FRAMES + 10]
    const late = features[band * MEL_FRAMES + MEL_FRAMES - 10]
    assert.ok(silentFrames > 600)
    assert.ok(late > early + 0.2, `early ${early}, late ${late}`)
  })

  it('ignores whatever came before the last eight seconds', () => {
    const tail = speechLike(8)
    const withHistory = new Float32Array(WINDOW_SAMPLES + SAMPLE_RATE)
    withHistory.set(speechLike(1, 5))
    withHistory.set(tail, SAMPLE_RATE)
    const a = extractFeatures(tail)
    const b = extractFeatures(withHistory)
    let worst = 0
    for (let i = 0; i < a.length; i++) worst = Math.max(worst, Math.abs(a[i] - b[i]))
    assert.ok(worst < 0.05, `largest difference ${worst}`)
  })
})

describe('TurnFeatures', () => {
  it('lands on the same picture as the one shot path', () => {
    const samples = speechLike(5)
    const features = new TurnFeatures()
    push(features, samples)
    // Frames are centred, so the last one needs a little audio past the turn.
    // A live microphone keeps delivering it on its own.
    features.push(new Float32Array(40))

    const streamed = features.read()
    const once = extractFeatures(samples)
    let worst = 0
    let total = 0
    for (let i = 0; i < once.length; i++) {
      const gap = Math.abs(once[i] - streamed[i])
      worst = Math.max(worst, gap)
      total += gap
    }
    // The two paths differ where the window opens, since one mirrors the audio
    // and the other has only silence to show, so a few frames drift apart
    const average = total / once.length
    assert.ok(worst < 1, `largest difference ${worst}`)
    assert.ok(average < 0.02, `average difference ${average}`)
  })

  it('does not care how the audio is cut up', () => {
    const samples = speechLike(4)
    const coarse = new TurnFeatures()
    push(coarse, samples, 4800)
    const fine = new TurnFeatures()
    push(fine, samples, 128)
    const a = coarse.read()
    const b = fine.read()
    for (let i = 0; i < a.length; i++) assert.ok(Math.abs(a[i] - b[i]) < 1e-6)
  })

  it('forgets the previous turn when reset', () => {
    const features = new TurnFeatures()
    push(features, speechLike(3, 9))
    features.reset()
    push(features, speechLike(2))

    const fresh = new TurnFeatures()
    push(fresh, speechLike(2))

    const a = features.read()
    const b = fresh.read()
    for (let i = 0; i < a.length; i++) assert.ok(Math.abs(a[i] - b[i]) < 1e-6)
  })

  it('counts the audio it holds, up to the eight second window', () => {
    const features = new TurnFeatures()
    push(features, speechLike(2))
    assert.ok(Math.abs(features.seconds - 2) < 0.01)
    push(features, speechLike(10))
    assert.equal(features.seconds, 8)
  })
})

describe('TurnFeatures and the silence at the end', () => {
  it('reads the same sentence however long the detector waited', () => {
    const samples = speechLike(4)
    const verdicts: Float32Array[] = []

    // The voice detector calls the turn over after a stretch of silence, and
    // once that stretch covers the tail the model keeps, waiting longer must
    // not change what it reads
    for (const silenceMs of [300, 640, 1500]) {
      const features = new TurnFeatures()
      push(features, samples)
      push(features, new Float32Array(Math.round((silenceMs / 1000) * SAMPLE_RATE)))
      verdicts.push(features.read().slice())
    }

    for (let i = 1; i < verdicts.length; i++) {
      let worst = 0
      for (let j = 0; j < verdicts[0].length; j++) {
        worst = Math.max(worst, Math.abs(verdicts[0][j] - verdicts[i][j]))
      }
      assert.ok(worst < 1e-6, `waiting longer moved the picture by ${worst}`)
    }
  })

  it('still hears a short pause inside the sentence', () => {
    // A gap in the middle is part of what the model reads, only the end is cut
    const halves = speechLike(2)
    const gap = new Float32Array(Math.round(0.3 * SAMPLE_RATE))
    const withGap = new TurnFeatures()
    push(withGap, halves)
    push(withGap, gap)
    push(withGap, halves)
    push(withGap, new Float32Array(Math.round(0.64 * SAMPLE_RATE)))

    const withoutGap = new TurnFeatures()
    push(withoutGap, halves)
    push(withoutGap, halves)
    push(withoutGap, new Float32Array(Math.round(0.64 * SAMPLE_RATE)))

    const a = withGap.read().slice()
    const b = withoutGap.read()
    let worst = 0
    for (let i = 0; i < a.length; i++) worst = Math.max(worst, Math.abs(a[i] - b[i]))
    assert.ok(worst > 0.5, `the gap left no trace, largest difference ${worst}`)
  })
})
