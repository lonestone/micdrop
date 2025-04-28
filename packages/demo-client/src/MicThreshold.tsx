import { Mic } from '@micdrop/client'
import { useEffect, useState } from 'react'

const volumeColor = '#00bb00'

export default function MicThreshold() {
  const [volume, setVolume] = useState(0) // 0-100

  // Update volume
  useEffect(() => {
    const onVolumeChange = (volume: number) => {
      setVolume(Math.max(0, volume + 100))
    }
    Mic.analyser.on('volume', onVolumeChange)
    return () => {
      Mic.analyser.off('volume', onVolumeChange)
    }
  }, [])

  return (
    <div
      className="w-full h-4 rounded-md transition-all duration-100"
      style={{
        background: `linear-gradient(
              to right,
              ${volumeColor},
              ${volumeColor} ${volume}%,
              #ccc ${volume}%,
              #ccc 100%
            )`,
        width: '100%',
      }}
    />
  )
}
