/**
 * How loud she is, right now, between 0 and 1.
 *
 * Written by the one file that knows Micdrop exists and read by the scene on
 * every frame, which is the arrangement everything else the two share already
 * uses. It keeps the client library out of `world/`, where a component that
 * imported it could no longer be mounted by the test bench.
 *
 * The speaker keeps an analyser of its own, but it samples it ten times a
 * second for a level meter, which is slower than the syllables it is measuring:
 * a shell driven off that number lurches between two mouth shapes instead of
 * following a voice. Reading the node directly costs one copy of five hundred
 * samples per frame and gives the envelope at the rate it is drawn.
 */

let source: AnalyserNode | undefined
// The buffer is typed on its own backing store, which is what the analyser
// requires: a plain Float32Array could be sitting on a SharedArrayBuffer.
let samples: Float32Array<ArrayBuffer> | undefined

/** Installed by the driver, and taken away when the call ends. */
export function hearVoice(node: AnalyserNode | undefined) {
  source = node
  samples = node ? new Float32Array(node.fftSize) : undefined
}

/**
 * Speech, when there is no speech to measure.
 *
 * The test bench runs without a microphone or an API key, which is the whole
 * point of it, so there is no audio there to read. Syllables inside words
 * inside breaths is enough of a shape to judge the effect by, and it never
 * runs during a call.
 */
function imagined(time: number): number {
  const syllable = 0.5 + 0.5 * Math.sin(time * 31)
  const word = 0.5 + 0.5 * Math.sin(time * 7.3 + 1.1)
  const breath = Math.max(0, Math.sin(time * 1.7))
  return syllable * (0.35 + 0.65 * word) * breath
}

/** The clock is only read when there is nothing to listen to. */
export function voiceLevel(time: number): number {
  if (!source || !samples) return imagined(time)

  source.getFloatTimeDomainData(samples)
  let sum = 0
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i]
  const rms = Math.sqrt(sum / samples.length)

  // A voice sits far below full scale, and loudness is heard closer to a
  // logarithm than to an amplitude, so the root is what puts an ordinary
  // sentence in the middle of the range rather than at the bottom of it. The
  // gain is the one number to move if a synthesis comes out louder or quieter
  // than most: at three, speech around a tenth of full scale reads near a half
  // and only a shout reaches the top.
  return Math.min(1, Math.sqrt(rms * 3))
}
