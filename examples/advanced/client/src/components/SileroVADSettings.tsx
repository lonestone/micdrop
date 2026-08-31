import { SileroVAD, SileroVADOptions } from '@micdrop/web'
import { useState } from 'react'
import ResetButton from './ResetButton'
import SliderRow from './SliderRow'

/** What the Silero model counts as speech, one 32 ms window at a time */
export default function SileroVADSettings({ vad }: { vad: SileroVAD }) {
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
    <>
      <SliderRow
        label="Positive Speech Threshold"
        help="Above this probability, a window counts as speech"
        value={options.positiveSpeechThreshold}
        min={0}
        max={1}
        step={0.01}
        onChange={(value) => setOption('positiveSpeechThreshold', value)}
      />
      <SliderRow
        label="Negative Speech Threshold"
        help="Below this probability, a window counts as silence"
        value={options.negativeSpeechThreshold}
        min={0}
        max={1}
        step={0.01}
        onChange={(value) => setOption('negativeSpeechThreshold', value)}
      />
      <SliderRow
        label="Min Speech Frames"
        help="Windows of speech needed before the turn opens"
        value={options.minSpeechFrames}
        min={1}
        max={40}
        step={1}
        onChange={(value) => setOption('minSpeechFrames', value)}
      />
      <SliderRow
        label="Redemption Frames"
        help="Windows of silence tolerated before the turn closes"
        value={options.redemptionFrames}
        min={1}
        max={40}
        step={1}
        onChange={(value) => setOption('redemptionFrames', value)}
      />
      <ResetButton onClick={resetOptions} />
    </>
  )
}
