import { useState } from 'react'
import { smartTurn, useDetection } from '../detection'
import ResetButton from './ResetButton'
import SliderRow from './SliderRow'

/**
 * What the turn detection model answers, and what happens when it is wrong.
 *
 * The last verdict is shown here rather than in the header because it is worth
 * reading with the thresholds that produced it.
 */
export default function SmartTurnSettings() {
  const { maxWait, lastResult, setMaxWait, resetSmartTurnOptions } =
    useDetection()
  const [threshold, setThreshold] = useState(smartTurn.options.threshold)

  const setOption = (value: number) => {
    setThreshold(value)
    smartTurn.setOptions({ threshold: value })
  }

  const resetOptions = () => {
    resetSmartTurnOptions()
    setThreshold(smartTurn.options.threshold)
  }

  return (
    <>
      <SliderRow
        label="Threshold"
        help="Above this, the sentence counts as finished"
        value={threshold}
        min={0.05}
        max={0.95}
        step={0.01}
        onChange={setOption}
      />
      <SliderRow
        label="Max wait"
        help="A held turn ends after this, so a wrong verdict never leaves the call hanging"
        value={maxWait}
        min={500}
        max={8000}
        step={100}
        format={(value) => `${(value / 1000).toFixed(1)} s`}
        onChange={setMaxWait}
      />
      <ResetButton onClick={resetOptions} />
      {lastResult && (
        <div className="text-sm text-gray-600">
          Last sentence read as{' '}
          <strong>{lastResult.complete ? 'finished' : 'unfinished'}</strong> at{' '}
          {Math.round(lastResult.probability * 100)}% confidence, answered in{' '}
          {lastResult.duration} ms
          {!lastResult.complete && (
            <>
              . The agent answers anyway if nothing more comes within{' '}
              {(maxWait / 1000).toFixed(1)} s
            </>
          )}
        </div>
      )}
    </>
  )
}
