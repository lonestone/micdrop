import { Lang } from '../../shared/lang'
import { SurgeField } from '../../shared/protocol'
import { useLang, useSurge } from '../store/hooks'
import { TEXT } from './text'

interface GestureBannerProps {
  /** True until the user has met one gesture, which is when the hint is due. */
  firstTime: boolean
}

/**
 * What she is doing, said the way she would say it.
 *
 * Each field carries the direction it is moving in, because a gesture that
 * cools her down must never be announced as one that warms her up.
 */
function doing(lang: Lang, fields: SurgeField[]): string {
  const text = TEXT[lang]
  const parts = fields
    .map((field) => text.gestures[field.id])
    .map((verbs, index) => (verbs ? (fields[index].up ? verbs.up : verbs.down) : ''))
    .filter(Boolean)

  if (!parts.length) return text.doing(text.everythingAtOnce)
  if (parts.length === 1) return text.doing(parts[0])
  const last = parts[parts.length - 1]
  return text.doing(`${parts.slice(0, -1).join(', ')} ${text.and} ${last}`)
}

/**
 * The words for what the rings around her mean.
 *
 * The scene already says that something is winding up; this says what, and once
 * only it says what to do about it. After that first time it never explains
 * itself again, because a mechanic that keeps introducing itself is a mechanic
 * nobody has learned.
 */
export default function GestureBanner({ firstTime }: GestureBannerProps) {
  const lang = useLang()
  const surge = useSurge()
  if (!surge) return null

  const text = TEXT[lang]

  const left = Math.max(0, 1 - surge.progress)

  if (surge.kind === 'charging') {
    return (
      <div className="animate-fade pointer-events-none absolute inset-x-0 top-36 flex flex-col items-center gap-2">
        <p className="text-sm text-[#ffcf9a]">
          {doing(lang, surge.fields)}
        </p>
        <div className="h-[2px] w-40 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-[#ffab5e]"
            style={{ width: `${left * 100}%` }}
          />
        </div>
        {firstTime && (
          <p className="text-[11px] tracking-wide text-[#9d9ab5]">
            {text.interrupt}
          </p>
        )}
      </div>
    )
  }

  // A gesture that ran its course is written all over her, so saying it in
  // words adds nothing. Only the one the user stopped is worth a line, because
  // that one is about something they did.
  if (surge.kind !== 'stopped') return null

  return (
    <div className="animate-fade pointer-events-none absolute inset-x-0 top-36 flex justify-center">
      <p className="text-sm text-[#9dc8ff]">{text.stoppedInTime}</p>
    </div>
  )
}
