import EventEmitter from 'eventemitter3'
import { SpeakerConcatPlayer } from './player/SpeakerConcatPlayer'
import { SpeakerMediaSourcePlayer } from './player/SpeakerMediaSourcePlayer'
import { SpeakerPlayer } from './player/SpeakerPlayer'
import { AudioAnalyser } from './utils/AudioAnalyser'
import { audioContext } from './utils/audioContext'
import { LocalStorageKeys } from './utils/localStorage'

export let speaker: Speaker

export interface SpeakerEvents {
  StartPlaying: void
  StopPlaying: void
}

class Speaker extends EventEmitter<SpeakerEvents> {
  public isPlaying = false
  public analyser: AudioAnalyser

  private audioElement?: HTMLAudioElement
  private player?: SpeakerPlayer

  constructor() {
    super()
    this.analyser = new AudioAnalyser(audioContext)

    // Create audio element if it doesn't exist
    this.audioElement = new Audio()
    this.audioElement.autoplay = true

    // Select speaker device if speakerId is in local storage
    const speakerId = localStorage.getItem(LocalStorageKeys.SpeakerDevice)
    if (speakerId) {
      this.setSinkId(speakerId).catch((error) => {
        console.error('Failed to set sink ID:', error)
      })
    }

    // Source -> Analyser
    this.setupSpeakerPlayer()

    // Analyser -> Destination
    const destinationNode = audioContext.createMediaStreamDestination()
    this.analyser.node.connect(destinationNode)

    // Destination -> Speaker
    this.audioElement.srcObject = destinationNode.stream
  }

  private async setupSpeakerPlayer() {
    try {
      this.player?.destroy()
      this.player = SpeakerMediaSourcePlayer.isCompatible
        ? new SpeakerMediaSourcePlayer(this.analyser.node)
        : new SpeakerConcatPlayer(this.analyser.node)
      await this.player?.setup()
      this.player.on('StartPlaying', () => this.changeIsPlaying(true))
      this.player.on('StopPlaying', () => this.changeIsPlaying(false))
    } catch (error) {
      console.error('Error setting up speaker player', error)
    }
  }

  protected changeIsPlaying(isPlaying: boolean) {
    if (this.isPlaying == isPlaying) return
    this.isPlaying = isPlaying
    this.emit(isPlaying ? 'StartPlaying' : 'StopPlaying')
  }

  canChangeDevice(): boolean {
    return (
      window.HTMLMediaElement && 'sinkId' in window.HTMLMediaElement.prototype
    )
  }

  private async setSinkId(speakerId?: string) {
    if (speakerId && this.canChangeDevice() && this.audioElement) {
      // @ts-ignore
      return this.audioElement.setSinkId(speakerId)
    }
  }

  async changeDevice(speakerId: string) {
    if (!this.canChangeDevice()) return
    try {
      await this.setSinkId(speakerId)
      localStorage.setItem(LocalStorageKeys.SpeakerDevice, speakerId)
    } catch (error) {
      console.error(`Error setting Audio Output to ${speakerId}`, error)
    }
  }

  pauseAudio() {
    if (this.audioElement) {
      this.audioElement.pause()
    }
  }

  resumeAudio() {
    if (this.audioElement) {
      this.audioElement.play()
    }
  }

  async playAudio(blob: Blob) {
    if (!this.audioElement || !this.player) return
    try {
      // Add blob to stream
      this.player.addBlob(blob)

      // Start playing if not already playing
      if (this.audioElement.paused) {
        this.audioElement.play()
      }
    } catch (error) {
      console.error('Error playing audio blob', error, blob)
    }
  }

  stopAudio() {
    this.audioElement?.pause()
    this.player?.stop()
  }
}

declare global {
  interface Window {
    micdropSpeaker: Speaker
  }
}

if (!window.micdropSpeaker) {
  window.micdropSpeaker = new Speaker()
}
speaker = window.micdropSpeaker
