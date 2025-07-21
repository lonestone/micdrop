import { audioContext } from '../utils/audioContext'
import { AudioStream } from './AudioStream'

const SAMPLE_RATE = 16000
const CHANNELS = 1

export class Pcm16AudioStream extends AudioStream {
  private audioQueue: AudioBuffer[] = []
  private currentSourceNode?: AudioBufferSourceNode
  private isProcessingQueue = false

  constructor() {
    super()
  }

  start(): AudioNode {
    return this.outputNode
  }

  async playAudio(blob: Blob): Promise<void> {
    try {
      // Convert blob to PCM data
      const arrayBuffer = await blob.arrayBuffer()

      // Convert PCM data to AudioBuffer with proper sample rate
      const audioBuffer = this.createAudioBuffer(arrayBuffer)

      if (audioBuffer) {
        this.audioQueue.push(audioBuffer)
        this.processQueue()
      }
    } catch (error) {
      console.error('Failed to play audio chunk:', error)
    }
  }

  stopAudio(): void {
    if (this.currentSourceNode) {
      try {
        this.currentSourceNode.stop()
        this.currentSourceNode.disconnect()
      } catch (error) {
        // Ignore errors when stopping
      }
      this.currentSourceNode = undefined
    }
    this.audioQueue = []
    this.isProcessingQueue = false
    this.setIsPlaying(false)
  }

  private createAudioBuffer(arrayBuffer: ArrayBuffer): AudioBuffer | null {
    try {
      // Convert ArrayBuffer to Int16Array (assuming 16-bit PCM)
      const int16Data = new Int16Array(arrayBuffer)

      // Calculate number of samples
      const numSamples = int16Data.length

      if (numSamples === 0) {
        return null
      }

      // Create AudioBuffer with the correct sample rate
      const audioBuffer = audioContext.createBuffer(
        CHANNELS,
        numSamples,
        SAMPLE_RATE
      )

      // Convert 16-bit PCM to float32 and copy to AudioBuffer
      const channelData = audioBuffer.getChannelData(0)
      for (let i = 0; i < numSamples; i++) {
        channelData[i] = int16Data[i] / 32768.0
      }

      return audioBuffer
    } catch (error) {
      console.error('Error creating AudioBuffer:', error)
      return null
    }
  }

  private processQueue(): void {
    if (this.isProcessingQueue || this.audioQueue.length === 0) {
      return
    }

    this.isProcessingQueue = true
    this.playNextBuffer()
  }

  private playNextBuffer(): void {
    if (this.audioQueue.length === 0) {
      this.isProcessingQueue = false
      this.setIsPlaying(false)
      return
    }

    const audioBuffer = this.audioQueue.shift()!

    // Create a new AudioBufferSourceNode
    this.currentSourceNode = audioContext.createBufferSource()
    this.currentSourceNode.buffer = audioBuffer
    this.currentSourceNode.connect(this.outputNode)

    // Set up event handler for when this buffer finishes
    this.currentSourceNode.onended = () => {
      this.currentSourceNode = undefined
      // Continue processing queue
      this.playNextBuffer()
    }

    // Start playing
    this.currentSourceNode.start(0)
    this.setIsPlaying(true)
  }
}
