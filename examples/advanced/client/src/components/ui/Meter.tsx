type Tone = 'accent' | 'voice'

interface MeterProps {
  /** Where the level sits between nothing and the loudest reading, 0 to 1 */
  value: number
  tone?: Tone
  label: string
}

const TONES: Record<Tone, string> = {
  accent: 'bg-accent',
  voice: 'bg-voice',
}

/**
 * A level, read live.
 *
 * The bar is scaled rather than resized, so following a voice costs the
 * compositor a transform instead of a layout on every frame.
 */
export default function Meter({ value, tone = 'accent', label }: MeterProps) {
  const level = Math.min(1, Math.max(0, value))

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <span className="shrink-0 text-xs text-faint">{label}</span>
      <div
        className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-inset"
        role="meter"
        aria-label={label}
        aria-valuenow={Math.round(level * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full w-full origin-left rounded-full transition-transform duration-100 ease-out ${TONES[tone]}`}
          style={{ transform: `scaleX(${level})` }}
        />
      </div>
    </div>
  )
}
