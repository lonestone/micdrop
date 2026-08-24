import { SceneEventId } from '../../shared/protocol'
import { eventFlash } from '../world/eventTiming'

interface EventFlashProps {
  id?: SceneEventId
  progress?: number
}

const TINTS: Record<SceneEventId, string> = {
  meteor: '255, 214, 168',
  flare: '255, 236, 190',
  eruption: '255, 150, 80',
  freeze: '200, 230, 255',
}

/** The part of a catastrophe that happens on the glass rather than in space. */
export default function EventFlash({ id, progress }: EventFlashProps) {
  if (!id || progress === undefined) return null

  // The same curve the planet shader uses, so the glass and the surface flare
  // together and neither announces the impact before it lands.
  const intensity = eventFlash({ id, progress }) * 0.75

  if (intensity <= 0.01) return null

  return (
    <div
      className="pointer-events-none absolute inset-0 transition-opacity duration-200"
      style={{ background: `rgba(${TINTS[id]}, ${intensity})` }}
    />
  )
}
