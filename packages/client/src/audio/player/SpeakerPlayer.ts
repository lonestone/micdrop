export abstract class SpeakerPlayer {
  protected audioContext: AudioContext

  constructor(protected outputNode: AudioNode) {
    // Ensure we have an AudioContext from the outputNode
    const ctx = outputNode.context
    if (!(ctx instanceof AudioContext)) {
      throw new Error('OutputNode must be connected to an AudioContext')
    }
    this.audioContext = ctx
  }

  abstract setup(): Promise<void>
  abstract addBlob(blob: Blob): void
  abstract stop(): void
  abstract destroy(): void
}
