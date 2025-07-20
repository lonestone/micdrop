import { useMicVolume } from '@micdrop/react'

const volumeColor = '#00bb00'

export default function MicVolume() {
  const { micVolume } = useMicVolume()
  const volume = Math.max(0, micVolume + 100)

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
