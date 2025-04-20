import { SpeakerPlayer } from './SpeakerPlayer'

export class SpeakerConcatPlayer extends SpeakerPlayer {
  private pendingBlobs: Blob[] = []
  private sourceStartTime: number | undefined
  private prevSourceDuration: number = 0
  private currentSource: AudioBufferSourceNode | undefined
  private nextSource: AudioBufferSourceNode | undefined
  private currentBuffer: ArrayBuffer | undefined
  private isConvertingBlob = false

  async setup() {}

  private replaceSource() {
    if (!this.nextSource) return

    const time = performance.now() / 1000
    const source = this.nextSource
    source.connect(this.outputNode)

    // Set up ended event handler for queue processing
    source.onended = () => {
      if (source !== this.currentSource) return
      this.prevSourceDuration = source.buffer?.duration ?? 0
      this.sourceStartTime = undefined
      this.currentSource = undefined
      source.disconnect()
      this.replaceSource()
    }

    // Calculate the offset for the source start time
    const offset =
      this.prevSourceDuration +
      (this.sourceStartTime ? time - this.sourceStartTime : 0)

    // Start the source with the calculated offset
    source.start(0, offset)

    if (!this.sourceStartTime) {
      this.sourceStartTime = time
    }
    this.currentSource?.stop()
    this.currentSource?.disconnect()
    this.currentSource = source
    this.nextSource = undefined
  }

  private async convertNextBlob() {
    if (this.pendingBlobs.length === 0 || this.isConvertingBlob) return
    this.isConvertingBlob = true
    const blob = this.pendingBlobs.shift()!

    try {
      // Convert blob to ArrayBuffer
      const arrayBuffer = await blob.arrayBuffer()

      // Concat buffers
      this.currentBuffer = this.currentBuffer
        ? this.concatArrayBuffers(this.currentBuffer, arrayBuffer)
        : arrayBuffer

      // Decode the audio data
      const audioBuffer = await this.audioContext.decodeAudioData(
        // Copy the buffer to avoid mutating the original
        this.copyArrayBuffer(this.currentBuffer)
      )

      // Create a new source node
      const source = this.audioContext.createBufferSource()
      source.buffer = audioBuffer
      this.nextSource = source
      this.replaceSource()
    } catch (error) {
      console.error('Error converting blob', error)
    } finally {
      this.isConvertingBlob = false
    }

    this.convertNextBlob()
  }

  private concatArrayBuffers(buffer1: ArrayBuffer, buffer2: ArrayBuffer) {
    const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength)
    tmp.set(new Uint8Array(buffer1), 0)
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength)
    return tmp.buffer
  }

  private copyArrayBuffer(buffer: ArrayBuffer) {
    const destination = new ArrayBuffer(buffer.byteLength)
    new Uint8Array(destination).set(new Uint8Array(buffer))
    return destination
  }

  addBlob(blob: Blob) {
    this.pendingBlobs.push(blob)
    this.convertNextBlob()
  }

  stop() {
    this.pendingBlobs.length = 0
    this.sourceStartTime = undefined
    this.prevSourceDuration = 0
    this.currentSource?.stop()
    this.currentSource?.disconnect()
    this.currentSource = undefined
    this.nextSource = undefined
    this.currentBuffer = undefined
    this.isConvertingBlob = false
  }

  destroy() {
    this.stop()
  }
}
