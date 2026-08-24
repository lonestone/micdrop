import { SceneEventId, SurgeKind } from '../../shared/protocol'
import { worldStore } from '../store/WorldStore'

/**
 * When things happen inside a scripted catastrophe, in fractions of its
 * duration. Shared by the rock, the wave and the camera, so the ground shakes
 * at the moment of impact rather than when the animation starts.
 */
export const METEOR_IMPACT = 0.3

/**
 * Where it lands, in her body frame. Chosen off centre but well inside the
 * visible face, so the wave is seen spreading rather than guessed at.
 */
export const METEOR_IMPACT_DIR: [number, number, number] = [0.6, 0.5, 0.62]

/** Where the rock comes from. */
export const METEOR_START: [number, number, number] = [6.5, 5.5, 5.0]

export interface EventProgress {
  id: SceneEventId
  /** 0 to 1 over the scripted duration. */
  progress: number
}

/**
 * Read straight from the store on every frame rather than handed down as a
 * prop.
 *
 * The scene lives in its own renderer root, and an animation that has to wait
 * for a React state update to cross that boundary is an animation that stutters
 * or, worse, never starts. Everything else in the scene already reads the store
 * this way.
 */
export function currentEvent(now = Date.now()): EventProgress | undefined {
  const { event } = worldStore.getSnapshot()
  if (!event) return undefined
  const progress = (now - event.startedAt) / 1000 / event.event.duration
  if (progress >= 1) return undefined
  return { id: event.event.id, progress }
}

export interface SurgeProgress {
  kind: SurgeKind
  progress: number
}

/** The gesture in flight, on the same terms and from the same store. */
export function currentSurge(now = Date.now()): SurgeProgress | undefined {
  const { surge } = worldStore.getSnapshot()
  if (!surge) return undefined
  const progress = (now - surge.startedAt) / 1000 / surge.surge.duration
  if (progress >= 1) return undefined
  return { kind: surge.surge.kind, progress }
}

/**
 * How bright the world flares at a given point of an event.
 *
 * Shared by the planet shader and the overlay so the two cannot disagree. A
 * meteor gives nothing until it lands: a flash at the start of the fall would
 * announce the impact several seconds before it happens.
 */
export function eventFlash(current: EventProgress | undefined): number {
  if (!current) return 0
  if (current.id === 'meteor') {
    if (current.progress < METEOR_IMPACT) return 0
    return Math.exp(-(current.progress - METEOR_IMPACT) / 0.035)
  }
  if (current.id === 'flare') {
    return Math.max(0, 1 - current.progress * 6)
  }
  if (current.id === 'freeze') {
    return Math.min(0.45, current.progress * 0.6)
  }
  return 0
}

/** How hard the camera is jolted at a given point of an event. */
export function eventShake(current: EventProgress | undefined): number {
  if (!current) return 0
  if (current.id === 'meteor') {
    if (current.progress < METEOR_IMPACT) return 0
    return Math.exp(-(current.progress - METEOR_IMPACT) / 0.08)
  }
  if (current.id === 'eruption') {
    return Math.sin(Math.min(1, current.progress) * Math.PI) * 0.55
  }
  return 0
}
