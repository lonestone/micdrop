import { EventEmitter } from 'eventemitter3'
import { AudioStream } from './stream/AudioStream'
import { Pcm16AudioStream } from './stream/Pcm16AudioStream'
import { AudioAnalyser } from './utils/AudioAnalyser'
import { audioContext } from './utils/audioContext'
import { LocalStorageKeys } from './utils/localStorage'

export interface SpeakerEvents {
  StartPlaying: void
  StopPlaying: void
}

export class Speaker extends EventEmitter<SpeakerEvents> {
  public isPlaying = false
  public analyser = new AudioAnalyser(audioContext)
  public deviceId: string | undefined

  // Set by MicdropClient, useful to detect default device
  public devices: MediaDeviceInfo[] = []

  private audioStream?: AudioStream
  private audioSourceNode?: AudioNode
  private audioElementDestination?: HTMLAudioElement // Used when audiocontext sinkId is not available

  async start() {
    if (this.audioStream) return

    // Instantiate the audio stream based on the browser compatibility
    this.audioStream = new Pcm16AudioStream()

    // Forward events from AudioStream
    this.audioStream.on('StartPlaying', () => this.setIsPlaying(true))
    this.audioStream.on('StopPlaying', () => this.setIsPlaying(false))

    // Get the audio source node from AudioStream
    this.audioSourceNode = this.audioStream.start()

    // Select speaker device if speakerId is in local storage
    const deviceId =
      localStorage.getItem(LocalStorageKeys.SpeakerDevice) ?? undefined
    await this.setDevice(deviceId)
  }

  async playAudio(blob: Blob) {
    this.start()
    try {
      await this.audioStream?.playAudio(blob)
    } catch (error) {
      console.error('Error playing audio blob', error, blob)
    }
  }

  async stopAudio() {
    if (!this.isPlaying) return
    this.audioStream?.stopAudio()
  }
  async changeDevice(deviceId: string) {
    await this.setDevice(deviceId)

    // Update local storage
    if (this.isDefaultDevice) {
      localStorage.removeItem(LocalStorageKeys.SpeakerDevice)
    } else {
      localStorage.setItem(LocalStorageKeys.SpeakerDevice, deviceId)
    }
  }

  get isDefaultDevice(): boolean {
    return (
      !this.deviceId ||
      this.devices.length === 0 ||
      this.deviceId === this.devices[0].deviceId
    )
  }

  private setIsPlaying(isPlaying: boolean) {
    if (this.isPlaying === isPlaying) return
    this.isPlaying = isPlaying
    this.emit(isPlaying ? 'StartPlaying' : 'StopPlaying')
  }

  private async setDevice(deviceId: string | undefined) {
    if (!this.audioSourceNode) {
      console.error(
        'audioSourceNode not initialized, setDevice called before start'
      )
      return
    }
    try {
      this.deviceId = deviceId
      const defaultDevice = this.isDefaultDevice
      const sinkId = !deviceId || defaultDevice ? '' : deviceId

      if (defaultDevice || 'setSinkId' in audioContext) {
        // Play through audiocontext destination when possible
        // It is the preferred way, as it's the only way to have echo cancellation
        await (audioContext as any).setSinkId?.(sinkId)
        this.audioSourceNode.disconnect()
        this.audioSourceNode.connect(audioContext.destination)
        this.audioSourceNode.connect(this.analyser.node)

        // Reset audio element destination if it exists
        if (this.audioElementDestination) {
          this.audioElementDestination.pause()
          this.audioElementDestination.srcObject = null
          this.audioElementDestination = undefined
        }
      } else {
        // On Firefox, we can't set sinkId on audio context
        // So we stream non-default devices back to an audio element for which we set sinkId
        if (!this.audioElementDestination) {
          // Create a media stream destination to stream the audio to
          const mediaStreamDestination =
            audioContext.createMediaStreamDestination()
          this.audioSourceNode.disconnect()
          this.audioSourceNode.connect(mediaStreamDestination)
          this.audioSourceNode.connect(this.analyser.node)

          // Play stream to audio element destination
          this.audioElementDestination = new Audio()
          this.audioElementDestination.autoplay = true
          this.audioElementDestination.srcObject = mediaStreamDestination.stream
        }
        await this.audioElementDestination.setSinkId(sinkId)
      }
    } catch (error) {
      console.error(`Error setting Audio Output to ${deviceId}`, error)
    }
  }
}
