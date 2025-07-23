import { MicdropState } from '@micdrop/client'
import { useMicdropState, useMicVolume, useSpeakerVolume } from '@micdrop/react'

interface Props {
  size: number
}

export default function CallStatusCircle({ size }: Props) {
  const state = useMicdropState()
  const { speakerVolume, maxSpeakerVolume } = useSpeakerVolume()
  const { micVolume, maxMicVolume } = useMicVolume()

  // Calculate circle size based on volume (min 20% of container size, max 100%)
  const circleSize =
    getSizeRatio(
      state,
      micVolume,
      maxMicVolume,
      speakerVolume,
      maxSpeakerVolume
    ) * size

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
    return 0.2 + 0.8 * Math.max(0, (micVolume + 100) / (maxMicVolume + 100))
  }
  if (state.isAssistantSpeaking) {
    return (
      0.2 + 0.8 * Math.max(0, (speakerVolume + 100) / (maxSpeakerVolume + 100))
    )
  }
  return 0.5
}
