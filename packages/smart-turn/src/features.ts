import {
  FRAME_SAMPLES,
  HOP_SAMPLES,
  MEL_BANDS,
  MEL_FRAMES,
  MelFrameScorer,
  normaliseBands,
  SILENT_BAND,
  SOUND_RANGE,
  TAIL_FRAMES,
  TRIM_FRAMES,
  WINDOW_SAMPLES,
} from './mel'

/** Frames kept, the window plus what can be trimmed off its end */
const RING_FRAMES = MEL_FRAMES + TRIM_FRAMES
/** Samples kept, for the same reason */
const RING_SAMPLES = WINDOW_SAMPLES + TRIM_FRAMES * HOP_SAMPLES

/**
 * Whisper log mel features for a whole turn, computed in one go.
 *
 * This is the reference path: the last eight seconds are taken, scaled, and
 * framed from the end of the turn backwards. Use it when the whole turn is
 * already in memory, on a server for instance.
 *
 * @param samples - Mono 16 kHz audio, the turn that just ended
 * @returns MEL_BANDS x MEL_FRAMES features, oldest frame first
 */
export function extractFeatures(samples: Float32Array): Float32Array {
  const window = new Float64Array(WINDOW_SAMPLES)
  if (samples.length >= WINDOW_SAMPLES) {
    for (let i = 0; i < WINDOW_SAMPLES; i++) {
      window[i] = samples[samples.length - WINDOW_SAMPLES + i]
    }
  } else {
    // A short turn sits at the end of the window, silence in front of it
    const offset = WINDOW_SAMPLES - samples.length
    for (let i = 0; i < samples.length; i++) window[offset + i] = samples[i]
  }

  let mean = 0
  for (let i = 0; i < WINDOW_SAMPLES; i++) mean += window[i]
  mean /= WINDOW_SAMPLES
  let variance = 0
  for (let i = 0; i < WINDOW_SAMPLES; i++) {
    const deviation = window[i] - mean
    variance += deviation * deviation
  }
  variance /= WINDOW_SAMPLES
  const scale = 1 / Math.sqrt(variance + 1e-7)
  for (let i = 0; i < WINDOW_SAMPLES; i++) window[i] = (window[i] - mean) * scale

  // Frames are centred, so the window is mirrored by half a frame on each side
  const half = FRAME_SAMPLES / 2
  const padded = new Float64Array(WINDOW_SAMPLES + FRAME_SAMPLES)
  for (let i = 0; i < WINDOW_SAMPLES; i++) padded[half + i] = window[i]
  for (let i = 0; i < half; i++) {
    padded[half - 1 - i] = window[i + 1]
    padded[half + WINDOW_SAMPLES + i] = window[WINDOW_SAMPLES - 2 - i]
  }

  const scorer = new MelFrameScorer()
  const bands = new Float64Array(MEL_BANDS * MEL_FRAMES)
  for (let frame = 0; frame < MEL_FRAMES; frame++) {
    const start = frame * HOP_SAMPLES
    scorer.score((i) => padded[start + i], bands, MEL_FRAMES, frame)
  }

  const output = new Float32Array(MEL_BANDS * MEL_FRAMES)
  normaliseBands(bands, 1, output)
  return output
}

/**
 * The same features, built while the speaker is still talking.
 *
 * One four hundred point transform every ten milliseconds costs a fraction of
 * a percent of a core, so when the turn ends the features are already there
 * and only the loudness scaling is left. Computing the eight seconds in one go
 * at that moment would instead block the thread for a fifth of a second on a
 * mid range phone, right where the delay is heard.
 */
export class TurnFeatures {
  private readonly scorer = new MelFrameScorer()
  private readonly bands = new Float64Array(MEL_BANDS * RING_FRAMES)
  /** How loud each frame was, to find where the speaker actually stopped */
  private readonly levels = new Float64Array(RING_FRAMES)
  private readonly samples = new Float64Array(RING_SAMPLES)
  private readonly ordered = new Float64Array(MEL_BANDS * MEL_FRAMES)
  private readonly output = new Float32Array(MEL_BANDS * MEL_FRAMES)

  /** Frames produced since the turn started */
  private frames = 0
  /** Samples received since the turn started */
  private written = 0
  /** Sum of the samples still inside the ring, to know where zero sits */
  private sum = 0
  /** Position of the next frame, half a frame ahead of its centre */
  private nextFrame = FRAME_SAMPLES / 2

  constructor() {
    this.reset()
  }

  /** Starts a new turn, forgetting everything that came before it */
  reset() {
    this.bands.fill(SILENT_BAND)
    this.levels.fill(-Infinity)
    this.samples.fill(0)
    this.frames = 0
    this.written = 0
    this.sum = 0
    this.nextFrame = FRAME_SAMPLES / 2
  }

  /** How much audio this turn holds, in seconds, up to the eight second window */
  get seconds(): number {
    return Math.min(this.written, WINDOW_SAMPLES) / 16000
  }

  /**
   * Feeds the audio captured since the last call
   * @param chunk - Mono 16 kHz samples, in the -1..1 range
   */
  push(chunk: Float32Array) {
    for (let i = 0; i < chunk.length; i++) {
      const slot = this.written % RING_SAMPLES
      this.sum += chunk[i] - this.samples[slot]
      this.samples[slot] = chunk[i]
      this.written++
      if (this.written === this.nextFrame) {
        this.addFrame()
        this.nextFrame += HOP_SAMPLES
      }
    }
  }

  private addFrame() {
    const { samples, written } = this
    const start = written - FRAME_SAMPLES
    // A microphone that sits a little off zero would otherwise light up the
    // lowest band, where the reference sees nothing
    const middle = this.sum / RING_SAMPLES
    const read = (i: number) => {
      const index = start + i
      return index < 0 ? 0 : samples[index % RING_SAMPLES] - middle
    }

    const slot = this.frames % RING_FRAMES
    this.scorer.score(read, this.bands, RING_FRAMES, slot)

    let energy = 0
    for (let i = 0; i < FRAME_SAMPLES; i++) {
      const sample = read(i)
      energy += sample * sample
    }
    this.levels[slot] = Math.log10(Math.max(energy / FRAME_SAMPLES, 1e-12))

    this.frames++
  }

  /**
   * Reads the features of the turn so far.
   *
   * The window stops shortly after the last word rather than at the last
   * sample, so however long the voice detector took to call the turn over, the
   * model reads the same sentence.
   */
  read(): Float32Array {
    const { samples, bands, levels, ordered, output } = this
    const newest = this.frames - 1
    if (newest < 0) {
      normaliseBands(ordered.fill(SILENT_BAND), 1, output)
      return output
    }

    // Walk back to the last frame that carried sound, and leave a short tail
    const oldest = Math.max(0, this.frames - RING_FRAMES)
    let loudest = -Infinity
    for (let f = oldest; f <= newest; f++) {
      const level = levels[f % RING_FRAMES]
      if (level > loudest) loudest = level
    }
    const floor = loudest - SOUND_RANGE
    let lastSound = newest
    while (lastSound > oldest && levels[lastSound % RING_FRAMES] < floor) {
      lastSound--
    }
    const end = Math.min(newest, lastSound + TAIL_FRAMES)

    // The eight second window that ends there, silence in front when the turn
    // is shorter than that
    for (let band = 0; band < MEL_BANDS; band++) {
      const row = band * RING_FRAMES
      for (let i = 0; i < MEL_FRAMES; i++) {
        const frame = end - MEL_FRAMES + 1 + i
        ordered[band * MEL_FRAMES + i] =
          frame < 0 ? SILENT_BAND : bands[row + (frame % RING_FRAMES)]
      }
    }

    // The loudness of the same window, the samples never written counting as
    // the silence they are
    const endSample = (end + 1) * HOP_SAMPLES
    const from = Math.max(0, endSample - WINDOW_SAMPLES)
    const heard = endSample - from
    let mean = 0
    for (let i = from; i < endSample; i++) mean += samples[i % RING_SAMPLES]
    mean /= WINDOW_SAMPLES
    let variance = 0
    for (let i = from; i < endSample; i++) {
      const deviation = samples[i % RING_SAMPLES] - mean
      variance += deviation * deviation
    }
    variance =
      (variance + (WINDOW_SAMPLES - heard) * mean * mean) / WINDOW_SAMPLES

    normaliseBands(ordered, Math.sqrt(variance + 1e-7), output)
    return output
  }
}
