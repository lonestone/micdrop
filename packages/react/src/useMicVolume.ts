import { Mic } from '@micdrop/client'
import { useEffect, useState } from 'react'

/**
 * Hook to get the microphone volume
 */
export function useMicVolume() {
  const [micVolume, setMicVolume] = useState(0) // 0-100
  const [maxMicVolume, setMaxMicVolume] = useState(1)

  useEffect(() => {
    const onMicVolumeChange = (volume: number) => {
      setMicVolume(volume)
      setMaxMicVolume((v) => Math.max(v, volume))
    }

    Mic.analyser.on('volume', onMicVolumeChange)

    return () => {
      Mic.analyser.off('volume', onMicVolumeChange)
    }
  }, [])

  return { micVolume, maxMicVolume }
}
