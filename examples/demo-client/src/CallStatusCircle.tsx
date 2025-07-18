import { Mic, MicdropState, Speaker } from '@micdrop/client'
import { useEffect, useState } from 'react'
import { useMicdropState } from './useMicdropState'

interface Props {
  size: number
}

export default function CallStatusCircle({ size }: Props) {
  const state = useMicdropState()
  const [speakerVolume, setSpeakerVolume] = useState(0) // 0-100
  const [micVolume, setMicVolume] = useState(0) // 0-100
  const [maxMicVolume, setMaxMicVolume] = useState(50)
  const [maxSpeakerVolume, setMaxSpeakerVolume] = useState(50)

  // Calculate circle size based on volume (min 20% of container size, max 100%)
  const circleSize =
    getSizeRatio(
      state,
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
          state
        )} rounded-full transition-all duration-500 ease-out`}
        style={{ width: circleSize, height: circleSize }}
      />
    </div>
  )
}

function getClassNames(state: MicdropState) {
  if (state.isListening) return 'border-2 border-green-500 animate-pulse'
  if (state.isProcessing) return 'bg-yellow-500 animate-bounce'
  if (state.isUserSpeaking) return 'bg-blue-500'
  if (state.isAssistantSpeaking) return 'bg-orange-500'
  return 'bg-gray-500'
}

function getSizeRatio(
  state: MicdropState,
  micVolume: number,
  maxMicVolume: number,
  speakerVolume: number,
  maxSpeakerVolume: number
) {
  if (state.isListening) return 0.6
  if (state.isProcessing) return 0.4
  if (state.isUserSpeaking) {
    return 0.2 + 0.8 * Math.max(0, micVolume / maxMicVolume)
  }
  if (state.isAssistantSpeaking) {
    return 0.2 + 0.8 * Math.max(0, speakerVolume / maxSpeakerVolume)
  }
  return 0.5
}
