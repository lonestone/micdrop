import { Mic, setMicdropStorage, Speaker } from '@micdrop/client'
import { WebMic } from './audio/WebMic'
import { WebSpeaker } from './audio/WebSpeaker'

/**
 * The node the assistant voice comes out of, to analyse or process it.
 *
 * Connect an AnalyserNode to it to read the envelope on your own frames, which
 * is finer than the ten levels a second the `Volume` event reports.
 * @returns The node, once the call has started
 */
export function getSpeakerOutput(): AudioNode | undefined {
  const driver = Speaker.getDriver()
  return driver instanceof WebSpeaker ? driver.output : undefined
}

export * from '@micdrop/client'
export * from './audio/audioContext'
export * from './audio/WebAudioSink'
export * from './audio/WebMic'
export * from './audio/WebSpeaker'

/**
 * Records and plays with the Web Audio API, and keeps settings in
 * `localStorage`. Called when the package is imported, so a page has nothing
 * to wire.
 */
export function registerWebAudio() {
  Mic.setDriver(new WebMic())
  Speaker.setDriver(new WebSpeaker())
  setMicdropStorage(localStorage)
}

registerWebAudio()
