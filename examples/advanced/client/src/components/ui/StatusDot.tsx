export type DotTone = 'idle' | 'accent' | 'voice' | 'warn' | 'danger'

const TONES: Record<DotTone, string> = {
  idle: 'bg-line-strong',
  accent: 'bg-accent',
  voice: 'bg-voice',
  warn: 'bg-warn',
  danger: 'bg-danger',
}

interface StatusDotProps {
  tone: DotTone
  /** What the colour means, for anyone who cannot read the colour */
  label: string
}

/** The state of one detector, in the smallest thing that can carry it */
export default function StatusDot({ tone, label }: StatusDotProps) {
  return (
    <span className="inline-flex items-center gap-2" title={label}>
      <span className="sr-only">{label}</span>
      <span
        aria-hidden="true"
        className={`h-2.5 w-2.5 rounded-full transition-colors duration-150 ease-rise ${TONES[tone]}`}
      />
    </span>
  )
}
