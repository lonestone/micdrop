const INTERVAL_MS = 100

class PCMProcessorWorklet extends AudioWorkletProcessor {
  constructor() {
    super()
    this.audioBuffer = []
    this.isRecording = false
    this.sourceSampleRate = 16000
    this.targetSampleRate = 16000
    this.resamplingRatio = 1
    this.CHUNK_INTERVAL_SAMPLES = Math.round(
      (this.sourceSampleRate * INTERVAL_MS) / 1000
    )

    // Listen for messages
    this.port.onmessage = this.handleMessage.bind(this)
  }

  handleMessage(event) {
    if (event.data.type === 'configure') {
      this.sourceSampleRate = event.data.sourceSampleRate
      this.targetSampleRate = event.data.targetSampleRate
      this.resamplingRatio = this.sourceSampleRate / this.targetSampleRate
      // Recalculate chunk interval for the source sample rate
      this.CHUNK_INTERVAL_SAMPLES = Math.round(
        (this.sourceSampleRate * INTERVAL_MS) / 1000
      )
    } else if (event.data.type === 'start') {
      this.isRecording = true
    } else if (event.data.type === 'stop') {
      this.isRecording = false
      // Clear any remaining audio buffer when stopping
      this.audioBuffer.length = 0
    }
  }

  process(inputs) {
    const input = inputs[0]

    if (input && input.length > 0 && this.isRecording) {
      const inputChannel = input[0]

      // Store audio data in buffer
      this.audioBuffer.push(new Float32Array(inputChannel))

      // Check if we have enough data for a chunk
      const totalSamples = this.audioBuffer.reduce(
        (sum, buffer) => sum + buffer.length,
        0
      )

      if (totalSamples >= this.CHUNK_INTERVAL_SAMPLES) {
        this.processChunk()
      }
    }

    return true
  }

  processChunk() {
    if (this.audioBuffer.length === 0) return

    // Calculate total samples
    const totalSamples = this.audioBuffer.reduce(
      (sum, buffer) => sum + buffer.length,
      0
    )
    if (totalSamples === 0) return

    // Merge all buffers
    const mergedBuffer = new Float32Array(totalSamples)
    let offset = 0
    for (const buffer of this.audioBuffer) {
      mergedBuffer.set(buffer, offset)
      offset += buffer.length
    }

    // Resample to target sample rate if necessary
    const resampledBuffer = this.resample(mergedBuffer)

    // Convert float32 to int16 PCM
    const pcmData = this.floatToPCM16(resampledBuffer)

    // Clear the buffer
    this.audioBuffer.length = 0

    // Send PCM chunk to main thread
    this.port.postMessage({
      type: 'chunk',
      data: pcmData,
    })
  }

  resample(inputBuffer) {
    // If no resampling needed, return original buffer
    if (this.resamplingRatio === 1) {
      return inputBuffer
    }

    // Calculate output length
    const outputLength = Math.round(inputBuffer.length / this.resamplingRatio)
    const outputBuffer = new Float32Array(outputLength)

    // Simple linear interpolation resampling
    for (let i = 0; i < outputLength; i++) {
      const srcIndex = i * this.resamplingRatio
      const srcIndexFloor = Math.floor(srcIndex)
      const srcIndexCeil = Math.min(srcIndexFloor + 1, inputBuffer.length - 1)
      const fraction = srcIndex - srcIndexFloor

      // Linear interpolation
      outputBuffer[i] =
        inputBuffer[srcIndexFloor] * (1 - fraction) +
        inputBuffer[srcIndexCeil] * fraction
    }

    return outputBuffer
  }

  floatToPCM16(floatData) {
    const pcmData = new Int16Array(floatData.length)
    for (let i = 0; i < floatData.length; i++) {
      const sample = Math.max(-1, Math.min(1, floatData[i]))
      pcmData[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff
    }
    return pcmData
  }
}

registerProcessor('pcm-processor', PCMProcessorWorklet)
