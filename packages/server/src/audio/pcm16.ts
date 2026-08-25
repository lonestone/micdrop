/**
 * Conversions between the PCM16 buffers exchanged with the Micdrop client and
 * the float samples that local speech models read and write.
 *
 * Both formats are mono. PCM16 is signed 16-bit little-endian, floats are in
 * the [-1, 1] range. Only the scale changes, the sample rate is left alone.
 */

const PCM16_MAX = 32767
const PCM16_MIN = -32768

/** Turns float samples into a PCM16 buffer, clamping anything out of range. */
export function float32ToPcm16(samples: Float32Array): Buffer {
  const buffer = Buffer.alloc(samples.length * 2)
  for (let i = 0; i < samples.length; i++) {
    const scaled = Math.round(samples[i] * PCM16_MAX)
    const clamped = Math.max(PCM16_MIN, Math.min(PCM16_MAX, scaled))
    buffer.writeInt16LE(clamped, i * 2)
  }
  return buffer
}

/**
 * Turns a PCM16 buffer into float samples.
 *
 * A trailing odd byte is dropped: it is half of a sample whose other half has
 * not arrived, and a caller feeding whole utterances never produces one.
 */
export function pcm16ToFloat32(buffer: Buffer): Float32Array {
  const length = Math.floor(buffer.length / 2)
  const samples = new Float32Array(length)
  for (let i = 0; i < length; i++) {
    samples[i] = buffer.readInt16LE(i * 2) / PCM16_MAX
  }
  return samples
}
