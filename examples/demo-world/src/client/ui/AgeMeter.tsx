import { useLang } from '../store/hooks'
import { TEXT } from './text'

interface AgeMeterProps {
  /** Seconds she has spent in balance. It only ever rises. */
  age: number
}

/**
 * The one number that only goes up, and the reason to stay: it measures care
 * rather than duration, because she only ages while everything agrees.
 */
export default function AgeMeter({ age }: AgeMeterProps) {
  const lang = useLang()
  const text = TEXT[lang]
  const years = Math.floor(age * 1000)

  return (
    <div className="animate-rise w-40 pt-2">
      <span className="text-[11px] uppercase tracking-[0.18em] text-[#7d7a92]">
        {text.age}
      </span>
      <div className="mt-1 font-light tabular-nums text-[#cfe3ff]">
        {years.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB')}
        <span className="ml-1 text-[11px] text-[#7d7a92]">{text.turns}</span>
      </div>
    </div>
  )
}
