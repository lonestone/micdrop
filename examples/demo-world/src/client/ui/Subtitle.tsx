import { useLang } from '../store/hooks'
import { Subtitle as SubtitleValue } from '../store/WorldStore'
import { TEXT } from './text'

interface SubtitleProps {
  subtitle?: SubtitleValue
}

/**
 * The only text anyone gets. Centred at the bottom, low contrast for the user's
 * own words and full contrast for hers, so the eye never has to work out who is
 * speaking.
 *
 * The people share her voice, since there is only one synthesis in the call, so
 * they get a look of their own instead: wider, warmer, carved. Nobody has to be
 * told that a different typeface is a different mouth.
 */
export default function Subtitle({ subtitle }: SubtitleProps) {
  const lang = useLang()
  if (!subtitle?.text) return null

  const style =
    subtitle.from === 'planet'
      ? 'text-lg text-[#f2eef8] sm:text-xl'
      : subtitle.from === 'people'
        ? 'text-base tracking-[0.14em] text-[#f0c98a] sm:text-lg'
        : 'text-base italic text-[#8d8aa0]'

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-16 flex flex-col items-center gap-1 px-6">
      {subtitle.from === 'people' && (
        <span className="text-[10px] uppercase tracking-[0.3em] text-[#7d6a52]">
          {TEXT[lang].below}
        </span>
      )}
      <p
        key={subtitle.text}
        className={['animate-fade max-w-2xl text-balance text-center leading-relaxed', style].join(
          ' '
        )}
      >
        {subtitle.text}
      </p>
    </div>
  )
}
