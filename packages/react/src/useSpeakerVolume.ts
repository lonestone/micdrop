import { Speaker } from '@micdrop/client'
import { useEffect, useState } from 'react'

/**
 * Hook to get the speaker volume
 */
export function useSpeakerVolume() {
  const [speakerVolume, setSpeakerVolume] = useState(0) // 0-100
  const [maxSpeakerVolume, setMaxSpeakerVolume] = useState(1)

  useEffect(() => {
    const onSpeakerVolumeChange = (volume: number) => {
      setSpeakerVolume(volume)
      setMaxSpeakerVolume((v) => Math.max(v, volume))
    }

    Speaker.analyser.on('volume', onSpeakerVolumeChange)

    return () => {
      Speaker.analyser.off('volume', onSpeakerVolumeChange)
    }
  }, [])

  return { speakerVolume, maxSpeakerVolume }
}
