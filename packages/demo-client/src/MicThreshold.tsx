import { Mic } from '@micdrop/client'
import React, { useContext, useEffect, useState } from 'react'
import { CallContext } from './CallContext'

const volumeColor = '#00bb00'

interface Props {
  className?: string
}

interface CallContextValue {
  micThreshold: number
  changeMicThreshold: (threshold: number) => void
}

export default function MicThreshold({ className = '' }: Props) {
  const { micThreshold, changeMicThreshold } = useContext(
    CallContext
  )! as CallContextValue
  const [volume, setVolume] = useState(0) // 0-100

  // Update volume
  useEffect(() => {
    const onVolumeChange = (volume: number) => {
      setVolume(Math.max(0, volume + 100))
    }
    Mic.micAnalyser?.on('volume', onVolumeChange)
    return () => {
      Mic.micAnalyser?.off('volume', onVolumeChange)
    }
  }, [])

  // Convert threshold from -100-0 range to 0-100 for the UI
  const sliderValue = micThreshold + 100
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    changeMicThreshold(value - 100)
  }

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative h-2 bg-gray-200 rounded-full">
        <div
          className="absolute h-full rounded-full transition-all duration-100"
          style={{
            background: `linear-gradient(
              to right,
              ${volumeColor},
              ${volumeColor} ${volume}%,
              #000 ${volume + 2}%,
              #000 100%
            )`,
            width: '100%',
          }}
        />
        <input
          type="range"
          min={0}
          max={100}
          step={0.1}
          value={sliderValue}
          onChange={handleChange}
          className="absolute w-full h-full opacity-0 cursor-pointer"
        />
        <div
          className="absolute h-4 w-4 -mx-2 bg-white rounded-full border-2 border-gray-700 transform -translate-y-1/2 top-1/2 pointer-events-none"
          style={{ left: `${sliderValue}%` }}
        />
      </div>
    </div>
  )
}
