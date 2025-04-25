import { Speaker } from '@micdrop/client'
import { useEffect, useState } from 'react'

interface Props {
  size: number
}

export default function SpeakerVolume({ size }: Props) {
  const [volume, setVolume] = useState(0) // 0-100

  // Update volume
  useEffect(() => {
    const onVolumeChange = (volume: number) => {
      setVolume(Math.max(0, volume + 100))
    }
    Speaker.analyser?.on('volume', onVolumeChange)
    return () => {
      Speaker.analyser?.off('volume', onVolumeChange)
    }
  }, [])

  // Calculate circle size based on volume (min 20% of container size, max 100%)
  const circleSize = Math.max(size * 0.2, (size * volume) / 100)

  return (
    <div
      className="flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <div
        className="rounded-full bg-blue-600 transition-all duration-100 ease-out"
        style={{
          width: circleSize,
          height: circleSize,
        }}
      />
    </div>
  )
}
