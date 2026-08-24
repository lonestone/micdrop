import { audioContext } from '../utils/audioContext'
import { AudioStream } from './AudioStream'

const SAMPLE_RATE = 16000
const CHANNELS = 1
// Buffer this much audio before starting a fresh playback. Providers (e.g.
// OpenAI TTS) often deliver a small first burst then pause while generating,
// so playing immediately underruns. Waiting for a duration of audio (rather
// than a wall-clock delay) naturally absorbs that slow start.
const PREBUFFER_DURATION = 100 // ms
// If no new chunk arrives for this long while still prebuffering, start anyway.
// Handles utterances shorter than PREBUFFER_DURATION (there is no explicit
// end-of-speech signal). Kept above providers' inter-chunk gaps so it does not
// fire mid-utterance.
const QUIET_FLUSH_DELAY = 600 // ms
// How long everything scheduled has to stay finished before the utterance is
// considered over and a fresh prebuffer is armed for the next one.
//
// Running out of scheduled audio is not the end of a sentence: a chunk that
// arrives a few milliseconds late leaves the same silence, and there is no
// end-of-speech signal to tell the two apart. Rearming immediately turns that
// small hole into a long one, since the late chunk then has to wait for a whole
// new prebuffer before it may be heard.
const UTTERANCE_END_DELAY = 300 // ms

export class Pcm16AudioStream extends AudioStream {
  private blobQueue: Blob[] = []
  private processing = false
  private sourceNodes: AudioBufferSourceNode[] = []
  private nextStartTime = 0
  private prebuffering = true
  private prebuffer: AudioBuffer[] = []
  private prebufferDuration = 0
  private quietTimer?: ReturnType<typeof setTimeout>
  private endTimer?: ReturnType<typeof setTimeout>

  constructor() {
    super()
  }

  start(): AudioNode {
    return this.outputNode
  }

  async playAudio(blob: Blob): Promise<void> {
    // Queue synchronously to preserve arrival order, then convert
    // sequentially: `blob.arrayBuffer()` is async, so converting several
    // chunks concurrently could schedule them out of order and scramble the
    // audio (especially when chunks arrive in a burst).
    this.blobQueue.push(blob)
    if (this.processing) return
    this.processing = true

    try {
      while (this.blobQueue.length > 0) {
        const next = this.blobQueue.shift()!
        try {
          const arrayBuffer = await next.arrayBuffer()
          const audioBuffer = this.createAudioBuffer(arrayBuffer)
          if (audioBuffer) this.handleBuffer(audioBuffer)
        } catch (error) {
          console.error('Failed to play audio chunk:', error)
        }
      }
    } finally {
      this.processing = false
    }
  }

  stopAudio(): void {
    for (const node of this.sourceNodes) {
      try {
        node.stop()
        node.disconnect()
      } catch (error) {
        // Ignore errors when stopping
      }
    }
    this.sourceNodes = []
    this.blobQueue = []
    this.nextStartTime = 0
    this.resetPrebuffer()
    this.setIsPlaying(false)
  }

  // Accumulate audio until enough is buffered, then start playing. Once
  // playing, schedule incoming buffers directly.
  private handleBuffer(audioBuffer: AudioBuffer): void {
    // Audio is still coming, so what just ran out was a hole, not an ending.
    if (this.endTimer !== undefined) {
      clearTimeout(this.endTimer)
      this.endTimer = undefined
    }

    if (!this.prebuffering) {
      this.scheduleBuffer(audioBuffer)
      return
    }

    this.prebuffer.push(audioBuffer)
    this.prebufferDuration += audioBuffer.duration * 1000 // ms

    if (this.prebufferDuration >= PREBUFFER_DURATION) {
      this.flushPrebuffer()
      return
    }

    // Restart the quiet timer: flush if the stream stalls (short utterance)
    if (this.quietTimer !== undefined) clearTimeout(this.quietTimer)
    this.quietTimer = setTimeout(() => this.flushPrebuffer(), QUIET_FLUSH_DELAY)
  }

  private flushPrebuffer(): void {
    if (this.quietTimer !== undefined) {
      clearTimeout(this.quietTimer)
      this.quietTimer = undefined
    }
    this.prebuffering = false
    const buffers = this.prebuffer
    this.prebuffer = []
    this.prebufferDuration = 0
    for (const audioBuffer of buffers) this.scheduleBuffer(audioBuffer)
  }

  private resetPrebuffer(): void {
    if (this.quietTimer !== undefined) {
      clearTimeout(this.quietTimer)
      this.quietTimer = undefined
    }
    if (this.endTimer !== undefined) {
      clearTimeout(this.endTimer)
      this.endTimer = undefined
    }
    this.prebuffering = true
    this.prebuffer = []
    this.prebufferDuration = 0
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

  private scheduleBuffer(audioBuffer: AudioBuffer): void {
    const sourceNode = audioContext.createBufferSource()
    sourceNode.buffer = audioBuffer
    sourceNode.connect(this.outputNode)

    // Schedule this buffer right after the previous one ends (or now for the
    // first one, since nextStartTime is 0)
    const now = audioContext.currentTime
    const startTime = Math.max(this.nextStartTime, now)
    this.nextStartTime = startTime + audioBuffer.duration

    sourceNode.onended = () => {
      // Remove from tracked nodes
      const index = this.sourceNodes.indexOf(sourceNode)
      if (index !== -1) this.sourceNodes.splice(index, 1)

      // Nothing left scheduled. That is the end of the utterance only if it
      // stays that way, so the prebuffer is armed on a delay: a chunk arriving
      // late is played straight away instead of waiting for a new one.
      if (this.sourceNodes.length === 0 && this.blobQueue.length === 0) {
        this.nextStartTime = 0
        this.setIsPlaying(false)
        if (this.endTimer !== undefined) clearTimeout(this.endTimer)
        this.endTimer = setTimeout(() => {
          this.endTimer = undefined
          this.resetPrebuffer()
        }, UTTERANCE_END_DELAY)
      }
    }

    this.sourceNodes.push(sourceNode)
    sourceNode.start(startTime)
    this.setIsPlaying(true)
  }
}
