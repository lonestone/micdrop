/**
 * PCM helpers shared by the microphone and the speaker.
 *
 * Everything here is pure so it can be exercised without a device: the same
 * functions run on iOS, on Android and in the test suite.
 */

/**
 * Resamples mono float samples with linear interpolation.
 * @param input - Mono samples, in the -1..1 range
 * @param inputRate - Sample rate of `input`, in Hz
 * @param outputRate - Wanted sample rate, in Hz
 * @returns The resampled samples, or `input` itself when both rates match
 */
export function resample(
  input: Float32Array,
  inputRate: number,
  outputRate: number
): Float32Array {
  if (inputRate === outputRate || input.length === 0) return input

  const ratio = inputRate / outputRate
  const outputLength = Math.round(input.length / ratio)
  const output = new Float32Array(outputLength)

  for (let i = 0; i < outputLength; i++) {
    const position = i * ratio
    const index = Math.floor(position)
    const nextIndex = Math.min(index + 1, input.length - 1)
    const fraction = position - index
    output[i] = input[index] * (1 - fraction) + input[nextIndex] * fraction
  }

  return output
}

/**
 * Converts float samples to signed 16 bits PCM
 * @param input - Mono samples, in the -1..1 range
 * @returns The same samples as 16 bits integers
 */
export function floatToPcm16(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length)
  for (let i = 0; i < input.length; i++) {
    const sample = Math.max(-1, Math.min(1, input[i]))
    output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff
  }
  return output
}

/**
 * Converts signed 16 bits PCM to float samples
 * @param input - Mono samples as 16 bits integers
 * @returns The same samples in the -1..1 range
 */
export function pcm16ToFloat(input: Int16Array): Float32Array {
  const output = new Float32Array(input.length)
  for (let i = 0; i < input.length; i++) {
    output[i] = input[i] / 32768
  }
  return output
}

/**
 * Concatenates chunks of samples into a single buffer
 * @param chunks - The chunks to concatenate, in order
 * @returns One buffer holding every sample
 */
export function concatFloat32(chunks: Float32Array[]): Float32Array {
  if (chunks.length === 1) return chunks[0]

  let length = 0
  for (const chunk of chunks) length += chunk.length

  const output = new Float32Array(length)
  let offset = 0
  for (const chunk of chunks) {
    output.set(chunk, offset)
    offset += chunk.length
  }
  return output
}

/**
 * Copies signed 16 bits PCM into a standalone ArrayBuffer, ready to be sent
 * over a WebSocket. A typed array can be a view on a larger buffer, sending it
 * as is would send the whole buffer.
 * @param pcm - The samples to send
 * @returns An ArrayBuffer holding exactly those samples
 */
export function pcm16ToArrayBuffer(pcm: Int16Array): ArrayBuffer {
  return pcm.buffer.slice(
    pcm.byteOffset,
    pcm.byteOffset + pcm.byteLength
  ) as ArrayBuffer
}
