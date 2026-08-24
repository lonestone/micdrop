import { useState } from 'react'
import { DEFAULT_LANG, Lang, LANGS } from '../../shared/lang'
import { TEXT } from './text'

interface StartScreenProps {
  onStart: (lang: Lang) => void
  starting: boolean
  error?: string
}

/**
 * A title, two flags and a button.
 *
 * Nothing explains what can be said, and nothing describes what she does: she
 * does the teaching, and she does it by going too far. The flags are the only
 * setting in the whole demo, and picking one changes the title under it, which
 * is all the confirmation the choice needs.
 */
export default function StartScreen({
  onStart,
  starting,
  error,
}: StartScreenProps) {
  const [lang, setLang] = useState<Lang>(DEFAULT_LANG)
  const text = TEXT[lang]

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-8 bg-[#05050b]/70 backdrop-blur-[2px]">
      <h1 className="text-2xl font-light tracking-[0.2em] text-[#e8e6f0]">
        {text.title}
      </h1>

      <div className="flex flex-col items-center gap-5">
        <div className="flex gap-2">
          {LANGS.map((code) => (
            <button
              key={code}
              type="button"
              tabIndex={0}
              aria-label={TEXT[code].pickAria}
              aria-pressed={code === lang}
              className={[
                'pointer-events-auto rounded-full border px-4 py-1.5 text-base transition',
                code === lang
                  ? 'border-white/40 bg-white/10'
                  : 'border-white/10 opacity-50 hover:opacity-90',
              ].join(' ')}
              onClick={() => setLang(code)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') setLang(code)
              }}
            >
              {TEXT[code].flag}
            </button>
          ))}
        </div>

        <button
          type="button"
          tabIndex={0}
          aria-label={text.playAria}
          disabled={starting}
          className="pointer-events-auto rounded-full border border-white/20 px-8 py-3 text-sm uppercase tracking-[0.2em] text-[#e8e6f0] transition hover:border-white/50 hover:bg-white/5 disabled:opacity-40"
          onClick={() => onStart(lang)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') onStart(lang)
          }}
        >
          {starting ? text.connecting : text.play}
        </button>
      </div>

      {error && <p className="text-sm text-[#ff9d7a]">{error}</p>}
    </div>
  )
}
