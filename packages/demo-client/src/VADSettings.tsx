import {
  CallHandler,
  MultipleVAD,
  SileroVAD,
  SileroVADOptions,
  VAD,
  VolumeVAD,
  VolumeVADOptions,
} from '@micdrop/client'
import { useState } from 'react'
import VADStatusCircle from './VADStatusCircle'

export default function VADSettings({ className }: { className?: string }) {
  const call = CallHandler.getInstance()
  return <AnyVADSettings vad={call.vad} className={className} />
}

interface VADProps<T extends VAD> {
  vad: T
  className?: string
}

function AnyVADSettings<T extends VAD>({ vad, className }: VADProps<T>) {
  if (vad instanceof SileroVAD) {
    return <SileroVADSettings vad={vad} className={className} />
  }
  if (vad instanceof VolumeVAD) {
    return <VolumeVADSettings vad={vad} className={className} />
  }
  if (vad instanceof MultipleVAD) {
    return <MultipleVADSettings vad={vad} className={className} />
  }
  console.warn('Unknown VAD', vad)
  return <div>Unknown VAD</div>
}

const blockClassName =
  'flex flex-col gap-4 border border-gray-300 rounded-md p-4'

function MultipleVADSettings({ vad, className }: VADProps<MultipleVAD>) {
  return (
    <div className={`${blockClassName} ${className}`}>
      <div className="flex items-center gap-2">
        <VADStatusCircle vad={vad} />
        <strong>MultipleVAD</strong>
      </div>
      {vad.vads.map((vad, i) => (
        <AnyVADSettings key={i} vad={vad} />
      ))}
    </div>
  )
}

function SileroVADSettings({ vad, className }: VADProps<SileroVAD>) {
  const [options, setOptions] = useState(vad.options)

  const setOption = (key: keyof SileroVADOptions, value: number) => {
    setOptions({ ...options, [key]: value })
    vad.setOptions({ [key]: value })
  }

  return (
    <div className={`${blockClassName} ${className}`}>
      <div className="flex items-center gap-2">
        <VADStatusCircle vad={vad} />
        <strong>SileroVAD</strong>
      </div>
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
    </div>
  )
}

function VolumeVADSettings({ vad, className }: VADProps<VolumeVAD>) {
  const [options, setOptions] = useState(vad.options)

  const setOption = (key: keyof VolumeVADOptions, value: number) => {
    setOptions({ ...options, [key]: value })
    vad.setOptions({ [key]: value })
  }

  return (
    <div className={`${blockClassName} ${className}`}>
      <div className="flex items-center gap-2">
        <VADStatusCircle vad={vad} />
        <strong>VolumeVAD</strong>
      </div>
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
    </div>
  )
}
