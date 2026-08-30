import { Speaker } from '@micdrop/client'
import { useEffect, useState } from 'react'

/**
 * Hook to get the speaker volume, in decibels between -Infinity and 0
 */
export function useSpeakerVolume() {
  const [speakerVolume, setSpeakerVolume] = useState(-Infinity)
  const [maxSpeakerVolume, setMaxSpeakerVolume] = useState(-Infinity)

  useEffect(() => {
    const onSpeakerVolumeChange = (volume: number) => {
      setSpeakerVolume(volume)
      setMaxSpeakerVolume((v) => Math.max(v, volume))
    }

    Speaker.on('Volume', onSpeakerVolumeChange)

    return () => {
      Speaker.off('Volume', onSpeakerVolumeChange)
    }
  }, [])

  return { speakerVolume, maxSpeakerVolume }
}
