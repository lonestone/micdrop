import { EventEmitter } from 'eventemitter3'

interface AudioAnalyserEvents {
  volume: [number]
}

export class AudioAnalyser extends EventEmitter<AudioAnalyserEvents> {
  public node: AnalyserNode
  public volume: number = -Infinity

  private fftSize = 512
  private fftBins = new Float32Array(this.fftSize)
  private interval: number | undefined

  constructor(
    audioContext: AudioContext,
    public volumeInterval = 100
  ) {
    super()
    this.node = audioContext.createAnalyser()

    // Volume detection
    this.node.fftSize = this.fftSize
    this.node.smoothingTimeConstant = 0.1
    this.interval = window.setInterval(() => {
      this.volume = this.getMaxVolume()
      this.emit('volume', this.volume)
    }, this.volumeInterval)
  }

  stop() {
    if (this.interval !== undefined) {
      window.clearInterval(this.interval)
    }
  }

  // Return values between -Infinity and 0
  private getMaxVolume() {
    let maxVolume = -Infinity
    this.node.getFloatFrequencyData(this.fftBins)

    for (let i = 4, ii = this.fftBins.length; i < ii; i++) {
      if (this.fftBins[i] > maxVolume && this.fftBins[i] < 0) {
        maxVolume = this.fftBins[i]
      }
    }
    return maxVolume
  }
}
