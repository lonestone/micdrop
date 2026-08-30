import { Mic } from '@micdrop/client'
import { useEffect, useState } from 'react'

/**
 * Hook to get the microphone volume, in decibels between -Infinity and 0
 */
export function useMicVolume() {
  const [micVolume, setMicVolume] = useState(-Infinity)
  const [maxMicVolume, setMaxMicVolume] = useState(-Infinity)

  useEffect(() => {
    const onMicVolumeChange = (volume: number) => {
      setMicVolume(volume)
      setMaxMicVolume((v) => Math.max(v, volume))
    }

    Mic.on('Volume', onMicVolumeChange)

    return () => {
      Mic.off('Volume', onMicVolumeChange)
    }
  }, [])

  return { micVolume, maxMicVolume }
}
