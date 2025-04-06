import { VAD } from './VAD'

/**
 * Volume-based Voice Activity Detection
 * Based on the hark library implementation
 */
export class VolumeVAD extends VAD {
  private audioContext: AudioContext | undefined
  private analyser: AnalyserNode | undefined
  private sourceNode: MediaStreamAudioSourceNode | undefined
  private fftBins: Float32Array | undefined
  private running: boolean = false
  private speaking: boolean = false
  private attemptSpeaking: boolean = false
  private history: number = 10
  private speakingHistory: number[] = []

  constructor() {
    super()
    // Initialize speaking history
    for (let i = 0; i < this.history; i++) {
      this.speakingHistory.push(0)
    }
  }

  private getMaxVolume(): number {
    if (!this.analyser || !this.fftBins) return -Infinity

    let maxVolume = -Infinity
    this.analyser.getFloatFrequencyData(this.fftBins)

    for (let i = 4; i < this.fftBins.length; i++) {
      if (this.fftBins[i] > maxVolume && this.fftBins[i] < 0) {
        maxVolume = this.fftBins[i]
      }
    }

    return maxVolume
  }

  get isStarted(): boolean {
    return this.running
  }

  async start(stream: MediaStream, threshold?: number): Promise<void> {
    if (this.running) return

    if (threshold !== undefined) {
      this.threshold = threshold
    }

    // Create audio context and nodes
    this.audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)()
    this.analyser = this.audioContext.createAnalyser()
    this.sourceNode = this.audioContext.createMediaStreamSource(stream)

    // Configure analyser
    this.analyser.fftSize = 512
    this.analyser.smoothingTimeConstant = 0.1
    this.fftBins = new Float32Array(this.analyser.frequencyBinCount)

    // Connect nodes
    this.sourceNode.connect(this.analyser)

    this.running = true
    this.startLoop()
  }

  private startLoop(): void {
    if (!this.running) return

    const currentVolume = this.getMaxVolume()

    // Check if started speaking
    if (currentVolume > this.threshold) {
      if (!this.speaking) {
        // Check recent history (last 3 samples)
        let recentHistory = 0
        for (
          let i = this.speakingHistory.length - 3;
          i < this.speakingHistory.length;
          i++
        ) {
          recentHistory += this.speakingHistory[i]
        }

        if (recentHistory >= 2) {
          this.speaking = true
          this.attemptSpeaking = false
          this.emit('ConfirmSpeaking')
        } else if (recentHistory === 1) {
          this.attemptSpeaking = true
          this.emit('StartSpeaking')
        }
      }
    }

    // Check if stopped speaking
    else if (this.speaking) {
      let totalHistory = 0
      for (let i = 0; i < this.speakingHistory.length; i++) {
        totalHistory += this.speakingHistory[i]
      }

      if (totalHistory === 0) {
        this.speaking = false
        this.emit('StopSpeaking')
      }
    }

    // Check if attempt has failed
    else if (this.attemptSpeaking) {
      // Check last sample
      let lastHistory = this.speakingHistory[this.speakingHistory.length - 1]

      if (lastHistory === 0) {
        this.attemptSpeaking = false
        this.emit('CancelSpeaking')
      }
    }

    // Update history
    this.speakingHistory.shift()
    this.speakingHistory.push(Number(currentVolume > this.threshold))

    // Schedule next check
    setTimeout(() => this.startLoop(), this.delay)
  }

  async stop(): Promise<void> {
    if (!this.running) return

    this.running = false
    this.speaking = false

    if (this.sourceNode) {
      this.sourceNode.disconnect()
      this.sourceNode = undefined
    }

    if (this.analyser) {
      this.analyser.disconnect()
      this.analyser = undefined
    }

    if (this.audioContext) {
      await this.audioContext.close()
      this.audioContext = undefined
    }

    this.fftBins = undefined
  }

  async setThreshold(threshold: number): Promise<void> {
    if (threshold === this.threshold) return
    this.threshold = threshold
  }
}
