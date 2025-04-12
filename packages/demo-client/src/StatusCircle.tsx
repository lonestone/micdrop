import { Mic, Speaker } from '@micdrop/client'
import { useContext, useEffect, useState } from 'react'
import { CallContext, CallContextValue } from './CallContext'

interface Props {
  size: number
}

export default function StatusCircle({ size }: Props) {
  const call = useContext(CallContext)!
  const [speakerVolume, setSpeakerVolume] = useState(0) // 0-100
  const [micVolume, setMicVolume] = useState(0) // 0-100

  // Update speaker and mic volume
  useEffect(() => {
    const onSpeakerVolumeChange = (volume: number) => {
      setSpeakerVolume(Math.max(0, volume + 100))
    }
    const onMicVolumeChange = (volume: number) => {
      setMicVolume(Math.max(0, volume + 100))
    }
    Speaker.speakerAnalyser?.on('volume', onSpeakerVolumeChange)
    Mic.micAnalyser?.on('volume', onMicVolumeChange)
    return () => {
      Speaker.speakerAnalyser?.off('volume', onSpeakerVolumeChange)
      Mic.micAnalyser?.off('volume', onMicVolumeChange)
    }
  }, [])

  // Calculate circle size based on volume (min 20% of container size, max 100%)
  const circleSize =
    call.isProcessing || call.isPaused
      ? size * 0.8
      : Math.max(
          size * 0.2,
          (size * (call.isSpeaking ? micVolume : speakerVolume)) / 100
        )

  return (
    <div
      className="flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <div
        className={`rounded-full transition-all duration-100 ease-out ${getColor(
          call
        )} ${call.isProcessing ? 'animate-pulse' : ''}`}
        style={{
          width: circleSize,
          height: circleSize,
        }}
      />
    </div>
  )
}

function getColor(call: CallContextValue) {
  if (call.isPaused) return 'bg-gray-500'
  if (call.isSpeaking) return 'bg-green-500'
  if (call.isProcessing) return 'bg-yellow-500'
  return 'bg-blue-500'
}
