/** One labelled slider, with the value it currently holds */
export default function SliderRow({
  label,
  help,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string
  help?: string
  value: number
  min: number
  max: number
  step: number
  /** How to write the value next to the slider, the raw number by default */
  format?: (value: number) => string
  onChange: (value: number) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <label title={help}>{label}</label>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(parseFloat(event.target.value))}
      />
      <span>{format ? format(value) : value}</span>
    </div>
  )
}
