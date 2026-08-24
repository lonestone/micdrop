import { Localized } from './lang'
import { COMFORT, Vital, WorldState, isComfortable, strain } from './world'

/**
 * Gauges are not shown, they are earned. One appears the first time a gesture
 * brings a vital back into its band, as though repairing her had created the
 * ability to measure her.
 *
 * They carry the word she used, never a technical one, and they never say
 * anything her voice has not already said. They exist to make progress felt,
 * not to be consulted.
 */

export interface Indicator {
  vital: Vital
  /** Her word for it. */
  label: Localized<string>
  band: [number, number]
}

export const INDICATORS: Record<Vital, Indicator> = {
  heat: {
    vital: 'heat',
    label: { fr: 'chaud', en: 'heat' },
    band: COMFORT.heat,
  },
  breath: {
    vital: 'breath',
    label: { fr: 'air', en: 'air' },
    band: COMFORT.breath,
  },
  water: {
    vital: 'water',
    label: { fr: 'eau', en: 'water' },
    band: COMFORT.water,
  },
  life: {
    vital: 'life',
    label: { fr: 'vie', en: 'life' },
    band: COMFORT.life,
  },
}

/** Where life and cities have to reach for the next act to open. */
export const LIFE_THRESHOLD = 0.32
export const CITY_THRESHOLD = 0.12

/** Written commandments after which the people consider the work finished. */
export const SCRIPTURE_LENGTH = 3

export type Phase =
  /** She has just lit up and she has never done anything. */
  | 'spark'
  /** She does what she is told, and then some. This is most of the demo. */
  | 'zeal'
  /** Something grew, and she takes full credit for it. */
  | 'life'
  /** They built, they light up at night, and they started quoting you. */
  | 'worship'
  /** The last act: a name, a last line of scripture, a link. */
  | 'legacy'

export interface Progress {
  phase: Phase
  /** Unlocked gauges, in the order she taught them. */
  indicators: Vital[]
  /** The aggregate gauge, revealed once she has a civilisation to age with. */
  ageUnlocked: boolean
  achievements: string[]
  /** What the people carved, in the order they carved it. */
  commandments: string[]
  /** How many gestures she was allowed to finish, and how many were cut off. */
  overshoots: number
  interruptions: number
  userName?: string
  planetName?: string
}

export const INITIAL_PROGRESS: Progress = {
  phase: 'spark',
  indicators: [],
  ageUnlocked: false,
  achievements: [],
  commandments: [],
  overshoots: 0,
  interruptions: 0,
}

/**
 * A gauge is unlocked when its vital comes back inside the band after having
 * been outside it, which is exactly the moment the user learned what it does.
 */
export function unlockedIndicators(
  progress: Progress,
  previous: WorldState,
  next: WorldState
): Vital[] {
  return (Object.keys(INDICATORS) as Vital[]).filter(
    (vital) =>
      !progress.indicators.includes(vital) &&
      !isComfortable(previous, vital) &&
      isComfortable(next, vital)
  )
}

/** How wrong a vital reads on screen, so the gauge can pulse when it hurts. */
export function indicatorStrain(state: WorldState, vital: Vital): number {
  return Math.min(1, strain(state, vital))
}
