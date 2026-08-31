import { useId } from 'react'

interface SliderProps {
  label: string
  help?: string
  value: number
  min: number
  max: number
  step: number
  disabled?: boolean
  /** How to write the value next to the label, the raw number by default */
  format?: (value: number) => string
  onChange: (value: number) => void
}

/**
 * One threshold, with the number it currently holds.
 *
 * The value sits at the end of the label line rather than after the track, so
 * a column of sliders lines up on both edges and the numbers can be compared
 * down the page while they are being moved.
 */
export default function Slider({
  label,
  help,
  value,
  min,
  max,
  step,
  disabled,
  format,
  onChange,
}: SliderProps) {
  const id = useId()
  const fill = ((value - min) / (max - min)) * 100

  return (
    <div className={`flex flex-col gap-1.5 ${disabled ? 'opacity-60' : ''}`}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm text-main">
          {label}
        </label>
        <span className="font-mono text-xs tabular-nums text-accent-ink">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        id={id}
        type="range"
        className="slider"
        style={{ ['--fill' as string]: `${fill}%` }}
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(event) => onChange(parseFloat(event.target.value))}
      />
      {help && <p className="text-xs leading-relaxed text-faint">{help}</p>}
    </div>
  )
}
