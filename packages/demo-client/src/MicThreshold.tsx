import { Mic } from '@micdrop/client'
import React, { useContext, useEffect, useState } from 'react'
import { CallContext } from './CallContext'

const volumeColor = '#00bb00'

export default function MicThreshold() {
  const { micThreshold, changeMicThreshold, isSpeaking } =
    useContext(CallContext)!
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

  // Convert threshold from -100-0 range to 0-100 for the UI
  const sliderValue = micThreshold + 100
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    changeMicThreshold(value - 100)
  }

  return (
    <div className="relative w-full">
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
          className={`absolute h-4 w-4 -mx-2 rounded-full border-2 transform -translate-y-1/2 top-1/2 pointer-events-none ${
            isSpeaking
              ? 'bg-green-500 border-green-700'
              : 'bg-white border-gray-700'
          }`}
          style={{ left: `${sliderValue}%` }}
        />
      </div>
    </div>
  )
}
