import EventEmitter from 'eventemitter3'

export interface VADEvents {
  // Speech starts, even it it's not confirmed
  StartSpeaking: void
  // Speech start is confirmed
  ConfirmSpeaking: void
  // Speech is cancelled, it's just noise and can be ignored
  CancelSpeaking: void
  // Speech stops, only if it's confirmed
  StopSpeaking: void
  // Status changed
  ChangeStatus: [VADStatus]
}

export enum VADStatus {
  Silence,
  MaybeSpeaking,
  Speaking,
}

/**
 * Abstract VAD class
 * VAD = Voice Activity Detection
 */
export abstract class VAD extends EventEmitter<VADEvents> {
  public readonly name = this.constructor.name
  public status: VADStatus = VADStatus.Silence

  // Max delay to detect speech, can be used to record delayed stream
  public delay = 100 // ms

  /**
   * Checks if the VAD is started
   * @returns True if the VAD is started, false otherwise
   */
  abstract get isStarted(): boolean

  /**
   * Starts the VAD
   * @param stream - The stream to start the VAD on
   */
  abstract start(stream: MediaStream): Promise<void>

  /**
   * Stops the VAD
   */
  abstract stop(): Promise<void>

  /**
   * Emits an event (overrides the default implementation)
   * @param event - The event to emit
   * @param args - The arguments to emit
   * @returns True if the event was emitted, false otherwise
   */
  emit<T extends keyof VADEvents>(
    event: T,
    ...args: EventEmitter.EventArgs<VADEvents, T>
  ) {
    switch (event) {
      case 'StartSpeaking':
        this.setStatus(VADStatus.MaybeSpeaking)
        break
      case 'ConfirmSpeaking':
        this.setStatus(VADStatus.Speaking)
        break
      case 'CancelSpeaking':
        this.setStatus(VADStatus.Silence)
        break
      case 'StopSpeaking':
        this.setStatus(VADStatus.Silence)
        break
      default:
        break
    }
    return super.emit(event, ...args)
  }

  /**
   * Sets the status of the VAD
   * @param status - The status to set
   */
  setStatus(status: VADStatus) {
    if (this.status === status) return
    this.status = status
    super.emit('ChangeStatus', status)
  }
}
