import { SpeakerPlayer } from './SpeakerPlayer'

export class SpeakerSequencePlayer extends SpeakerPlayer {
  private pendingBlobs: Blob[] = []
  private pendingSources: AudioBufferSourceNode[] = []
  private currentSource: AudioBufferSourceNode | undefined
  private isConvertingBlob = false

  async setup() {}

  private processQueue() {
    if (this.pendingSources.length === 0 || this.currentSource) return

    const source = this.pendingSources.shift()!
    this.currentSource = source
    source.connect(this.outputNode)

    // Set up ended event handler for queue processing
    source.onended = () => {
      source.disconnect()
      this.currentSource = undefined
      if (this.pendingSources.length === 0) {
        this.changeIsPlaying(false)
      } else {
        this.processQueue()
      }
    }

    source.start(0)
  }

  private async convertNextBlob() {
    if (this.pendingBlobs.length === 0 || this.isConvertingBlob) return
    this.isConvertingBlob = true
    const blob = this.pendingBlobs.shift()!

    try {
      // Convert blob to ArrayBuffer
      const arrayBuffer = await blob.arrayBuffer()

      // Decode the audio data
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)

      // Create a new source node
      const source = this.audioContext.createBufferSource()
      source.buffer = audioBuffer

      // Add to queue and process if not already processing
      this.pendingSources.push(source)
      this.processQueue()
    } catch (error) {
      console.error('Error converting blob', error)
    } finally {
      this.isConvertingBlob = false
    }

    this.convertNextBlob()
  }

  addBlob(blob: Blob) {
    this.changeIsPlaying(true)
    this.pendingBlobs.push(blob)
    this.convertNextBlob()
  }

  stop() {
    this.pendingBlobs.length = 0
    this.pendingSources.length = 0
    this.currentSource?.stop()
    this.currentSource?.disconnect()
    this.currentSource = undefined
  }

  destroy() {
    super.destroy()
    this.stop()
  }
}
