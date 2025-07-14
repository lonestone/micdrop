import { Mic, Speaker } from '@micdrop/client'
import { useContext, useEffect, useState } from 'react'
import { CallContext, CallContextValue } from './CallContext'

interface Props {
  size: number
}

export default function CallStatusCircle({ size }: Props) {
  const call = useContext(CallContext)!
  const [speakerVolume, setSpeakerVolume] = useState(0) // 0-100
  const [micVolume, setMicVolume] = useState(0) // 0-100
  const [maxMicVolume, setMaxMicVolume] = useState(50)
  const [maxSpeakerVolume, setMaxSpeakerVolume] = useState(50)

  // Calculate circle size based on volume (min 20% of container size, max 100%)
  const circleSize =
    getSizeRatio(
      call,
      micVolume,
      maxMicVolume,
      speakerVolume,
      maxSpeakerVolume
    ) * size

  // Update speaker and mic volume
  useEffect(() => {
    const onSpeakerVolumeChange = (volume: number) => {
      setSpeakerVolume(Math.max(0, volume + 100))
      setMaxSpeakerVolume((v) => Math.max(v, volume + 100))
    }
    const onMicVolumeChange = (volume: number) => {
      setMicVolume(Math.max(0, volume + 100))
      setMaxMicVolume((v) => Math.max(v, volume + 100))
    }
    Speaker.analyser.on('volume', onSpeakerVolumeChange)
    Mic.analyser.on('volume', onMicVolumeChange)
    return () => {
      Speaker.analyser.off('volume', onSpeakerVolumeChange)
      Mic.analyser.off('volume', onMicVolumeChange)
    }
  }, [])

  return (
    <div
      className="flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <div
        className={`${getClassNames(
          call
        )} rounded-full transition-all duration-500 ease-out`}
        style={{ width: circleSize, height: circleSize }}
      />
    </div>
  )
}

function getClassNames(call: CallContextValue) {
  if (call.isListening) return 'border-2 border-green-500 animate-pulse'
  if (call.isProcessing) return 'bg-yellow-500 animate-bounce'
  if (call.isUserSpeaking) return 'bg-blue-500'
  if (call.isAssistantSpeaking) return 'bg-orange-500'
  return 'bg-gray-500'
}

function getSizeRatio(
  call: CallContextValue,
  micVolume: number,
  maxMicVolume: number,
  speakerVolume: number,
  maxSpeakerVolume: number
) {
  if (call.isListening) return 0.6
  if (call.isProcessing) return 0.4
  if (call.isUserSpeaking) {
    return 0.2 + 0.8 * Math.max(0, micVolume / maxMicVolume)
  }
  if (call.isAssistantSpeaking) {
    return 0.2 + 0.8 * Math.max(0, speakerVolume / maxSpeakerVolume)
  }
  return 0.5
}
