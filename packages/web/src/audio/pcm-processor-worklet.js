// Hands the microphone signal to the main thread, continuously.
//
// Deciding whether someone is speaking, keeping a reserve of audio and cutting
// it into chunks all happen in @micdrop/client, so this only has to deliver the
// samples at a steady pace.

const INTERVAL_MS = 20

class PCMProcessorWorklet extends AudioWorkletProcessor {
  constructor() {
    super()
    this.buffers = []
    this.length = 0
    // `sampleRate` is provided by the worklet scope
    this.frameLength = Math.round((sampleRate * INTERVAL_MS) / 1000)
  }

  process(inputs) {
    const input = inputs[0]
    if (!input || input.length === 0) return true

    this.buffers.push(new Float32Array(input[0]))
    this.length += input[0].length
    if (this.length < this.frameLength) return true

    const frames = new Float32Array(this.length)
    let offset = 0
    for (const buffer of this.buffers) {
      frames.set(buffer, offset)
      offset += buffer.length
    }
    this.buffers.length = 0
    this.length = 0

    this.port.postMessage({ type: 'frames', frames, sampleRate }, [
      frames.buffer,
    ])
    return true
  }
}

registerProcessor('pcm-processor', PCMProcessorWorklet)
