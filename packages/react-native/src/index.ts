import { Mic, Speaker } from '@micdrop/client'
import { NativeMic } from './audio/NativeMic'
import { NativeSpeaker } from './audio/NativeSpeaker'

export * from '@micdrop/client'
export * from './audio/context'
export * from './audio/NativeMic'
export * from './audio/NativeSink'
export * from './audio/NativeSpeaker'

/**
 * Records and plays with react-native-audio-api. Called when the package is
 * imported, so an app has nothing to wire.
 */
export function registerNativeAudio() {
  Mic.setDriver(new NativeMic())
  Speaker.setDriver(new NativeSpeaker())
}

registerNativeAudio()
