import { Progress } from './indicators'
import { Vital, WorldState, clamp } from './world'

/**
 * What travels from the server to the browser on every tool call.
 *
 * All six tools emit the very same shape, so the browser has one handler and
 * the test page has one thing to fake.
 */

export type CameraTarget = 'whole' | 'surface' | 'sky' | 'night' | 'far' | 'star'

export type SceneEventId = 'meteor' | 'flare' | 'eruption' | 'freeze'

export interface SceneEvent {
  id: SceneEventId
  /** How long the scripted animation runs, in seconds. */
  duration: number
}

export const SCENE_EVENTS: Record<SceneEventId, SceneEvent> = {
  meteor: { id: 'meteor', duration: 14 },
  flare: { id: 'flare', duration: 18 },
  eruption: { id: 'eruption', duration: 16 },
  freeze: { id: 'freeze', duration: 20 },
}

/** What each event does to her, applied once when it starts. */
export const EVENT_IMPACT: Record<SceneEventId, Partial<WorldState>> = {
  meteor: { water: -0.18, clouds: 0.4, life: -0.15 },
  flare: { heat: 0.3, breath: -0.12 },
  eruption: { heat: 0.22, breath: 0.2, clouds: 0.35 },
  freeze: { heat: -0.3, water: -0.1 },
}

/**
 * The three states of a gesture she has started.
 *
 * `charging` is the tell: it says, without a word of tutorial, that something
 * bigger is on its way and that there is still time to say something. Whichever
 * of the other two follows is the answer to whether anyone did.
 */
export type SurgeKind = 'charging' | 'overshoot' | 'stopped'

export interface SurgeField {
  /** Which of her numbers is moving. */
  id: string
  /** Which way it moves, so the interface never says warm while she cools. */
  up: boolean
}

export interface Surge {
  kind: SurgeKind
  /** How long the animation runs, in seconds. */
  duration: number
  /** What she is about to exaggerate, so the interface can say it in a word. */
  fields: SurgeField[]
}

export interface WorldUpdate {
  world: WorldState
  progress: Progress
  /** Gauges revealed by this very update, so they can appear one by one. */
  unlocked: Vital[]
  /** Achievement ids earned by this very update. */
  achievements: string[]
  /** Short sentence the LLM reads to know how she feels right now. */
  feeling: string
  event?: SceneEvent
  look?: CameraTarget
  surge?: Surge
  /** A line the people said, which the interface renders as theirs, not hers. */
  chorus?: string
}

/** Applies what an event does to her, once, when it starts. */
export function applyEventImpact(
  world: WorldState,
  id: SceneEventId
): WorldState {
  const next = { ...world }
  for (const [key, delta] of Object.entries(EVENT_IMPACT[id])) {
    const field = key as keyof WorldState
    if (typeof next[field] === 'number') {
      ;(next as any)[field] = clamp((next[field] as number) + (delta as number))
    }
  }
  return next
}

/** How long the charge lasts, and therefore how long there is to interrupt. */
export const SURGE_CHARGE = 4.5
export const SURGE_RELEASE = 2.6
