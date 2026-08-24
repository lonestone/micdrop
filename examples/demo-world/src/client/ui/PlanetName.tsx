import { encodeWorld } from '../../shared/world'
import { WorldState } from '../../shared/world'
import { useLang } from '../store/hooks'
import { TEXT } from './text'

interface PlanetNameProps {
  name?: string
  world: WorldState
}

/**
 * The ending. A whole world is a handful of numbers, so the link is the world:
 * whoever opens it gets exactly this planet back.
 */
export default function PlanetName({ name, world }: PlanetNameProps) {
  const lang = useLang()
  if (!name) return null
  const link = `${location.origin}${location.pathname}#${encodeWorld(world)}`

  return (
    <div className="animate-rise pointer-events-none absolute inset-x-0 top-1/2 flex flex-col items-center gap-3">
      <p className="text-[11px] uppercase tracking-[0.35em] text-[#7d7a92]">
        {TEXT[lang].myNameIs}
      </p>
      <h1 className="text-4xl font-light tracking-wide text-[#f2eef8]">{name}</h1>
      <button
        type="button"
        className="pointer-events-auto rounded-full border border-white/10 px-4 py-1.5 text-xs text-[#a9a5bd] transition hover:border-white/25 hover:text-[#e5e1f0]"
        aria-label={TEXT[lang].copyLinkAria}
        onClick={() => navigator.clipboard?.writeText(link)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') navigator.clipboard?.writeText(link)
        }}
      >
        {TEXT[lang].copyLink}
      </button>
    </div>
  )
}
