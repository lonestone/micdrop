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
}

/**
 * Abstract VAD class
 * VAD = Voice Activity Detection
 */
export abstract class VAD extends EventEmitter<VADEvents> {
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
}
