import {
  Micdrop,
  MultipleVAD,
  SileroVAD,
  SileroVADOptions,
  VAD,
  VolumeVAD,
  VolumeVADOptions,
} from '@micdrop/client'
import { useMicdropState } from '@micdrop/react'
import { useState } from 'react'
import { FaChevronDown } from 'react-icons/fa'
import VADStatusCircle from './VADStatusCircle'

export default function VADSettings({ className }: { className?: string }) {
  useMicdropState() // Rerender when VAD changes
  if (!Micdrop.vad) return null
  return <AnyVADSettings vad={Micdrop.vad} className={className} />
}

interface VADProps<T extends VAD> {
  vad: T
  className?: string
}

function AnyVADSettings<T extends VAD>({ vad, className }: VADProps<T>) {
  // Check name of VAD to use the correct component
  // We don't use instanceof because it's not reliable with hot reloading
  if (vad.name === 'SileroVAD') {
    return (
      <SileroVADSettings
        vad={vad as unknown as SileroVAD}
        className={className}
      />
    )
  }
  if (vad.name === 'VolumeVAD') {
    return (
      <VolumeVADSettings
        vad={vad as unknown as VolumeVAD}
        className={className}
      />
    )
  }
  if (vad.name === 'MultipleVAD') {
    return (
      <MultipleVADSettings
        vad={vad as unknown as MultipleVAD}
        className={className}
      />
    )
  }
  console.warn('Unknown VAD', vad)
  return <div>Unknown VAD</div>
}

function MultipleVADSettings({ vad, className }: VADProps<MultipleVAD>) {
  return (
    <VADCard
      name="MultipleVAD"
      description="Combines multiple VAD algorithms"
      vad={vad}
      className={className}
    >
      {vad.vads.map((vad, i) => (
        <AnyVADSettings key={i} vad={vad} />
      ))}
    </VADCard>
  )
}

function SileroVADSettings({ vad, className }: VADProps<SileroVAD>) {
  const [options, setOptions] = useState(vad.options)

  const setOption = (key: keyof SileroVADOptions, value: number) => {
    setOptions({ ...options, [key]: value })
    vad.setOptions({ [key]: value })
  }

  const resetOptions = () => {
    vad.resetOptions()
    setOptions(vad.options)
  }

  return (
    <VADCard
      name="SileroVAD"
      description="AI-powered voice activity detection"
      vad={vad}
      className={className}
    >
      <div className="flex items-center gap-2">
        <label>Positive Speech Threshold</label>
        <input
          type="range"
          value={options.positiveSpeechThreshold}
          min={0}
          max={1}
          step={0.01}
          onChange={(e) =>
            setOption('positiveSpeechThreshold', parseFloat(e.target.value))
          }
        />
        <span>{options.positiveSpeechThreshold}</span>
      </div>
      <div className="flex items-center gap-2">
        <label>Negative Speech Threshold</label>
        <input
          type="range"
          value={options.negativeSpeechThreshold}
          min={0}
          max={1}
          step={0.01}
          onChange={(e) =>
            setOption('negativeSpeechThreshold', parseFloat(e.target.value))
          }
        />
        <span>{options.negativeSpeechThreshold}</span>
      </div>
      <div className="flex items-center gap-2">
        <label>Min Speech Frames</label>
        <input
          type="range"
          value={options.minSpeechFrames}
          min={1}
          max={40}
          step={1}
          onChange={(e) =>
            setOption('minSpeechFrames', parseInt(e.target.value))
          }
        />
        <span>{options.minSpeechFrames}</span>
      </div>
      <div className="flex items-center gap-2">
        <label>Redemption Frames</label>
        <input
          type="range"
          value={options.redemptionFrames}
          min={1}
          max={40}
          step={1}
          onChange={(e) =>
            setOption('redemptionFrames', parseInt(e.target.value))
          }
        />
        <span>{options.redemptionFrames}</span>
      </div>
      <div className="flex justify-end">
        <button
          onClick={resetOptions}
          className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded border border-gray-300 transition-colors"
        >
          Reset to default
        </button>
      </div>
    </VADCard>
  )
}

function VolumeVADSettings({ vad, className }: VADProps<VolumeVAD>) {
  const [options, setOptions] = useState(vad.options)

  const setOption = (key: keyof VolumeVADOptions, value: number) => {
    setOptions({ ...options, [key]: value })
    vad.setOptions({ [key]: value })
  }

  const resetOptions = () => {
    vad.resetOptions()
    setOptions(vad.options)
  }

  return (
    <VADCard
      name="VolumeVAD"
      description="Volume-based voice detection"
      vad={vad}
      className={className}
    >
      <div className="flex items-center gap-2">
        <label>History</label>
        <input
          type="range"
          value={options.history}
          min={1}
          max={20}
          step={1}
          onChange={(e) => setOption('history', parseInt(e.target.value))}
        />
        <span>{options.history}</span>
      </div>
      <div className="flex items-center gap-2">
        <label>Threshold</label>
        <input
          type="range"
          value={options.threshold}
          min={-100}
          max={0}
          step={1}
          onChange={(e) => setOption('threshold', parseInt(e.target.value))}
        />
        <span>{options.threshold} dB</span>
      </div>
      <div className="flex justify-end">
        <button
          onClick={resetOptions}
          className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded border border-gray-300 transition-colors"
        >
          Reset to default
        </button>
      </div>
    </VADCard>
  )
}

interface VADCardProps {
  name: string
  description: string
  vad: VAD
  className?: string
  children: React.ReactNode
}

function VADCard({
  name,
  description,
  vad,
  className,
  children,
}: VADCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className={`border border-gray-200 shadow-sm rounded-lg ${className}`}>
      <div
        className="flex items-center gap-2 p-4 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <VADStatusCircle vad={vad} />
        <div className="flex-1">
          <strong>{name}</strong>
          <span className="ml-3 text-sm text-gray-600">{description}</span>
        </div>
        <FaChevronDown className={`w-4 h-4 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && <div className="flex flex-col gap-4 p-4 pt-2">{children}</div>}
    </div>
  )
}
