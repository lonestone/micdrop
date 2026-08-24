import { ProgressContext, newAchievements } from './achievements'
import {
  CITY_THRESHOLD,
  LIFE_THRESHOLD,
  Phase,
  Progress,
  unlockedIndicators,
} from './indicators'
import { Vital, WorldState } from './world'

/**
 * Progression is derived, never transmitted as a diff, so the browser and the
 * server can each run it on their own copy of a deterministic world and land on
 * the same result.
 *
 * Every act but the last is a fact about the world rather than a decision: she
 * has done something, something grew, something built. Only the ending is the
 * server's to declare, because it needs a name from a human.
 */

const PHASE_ORDER: Phase[] = ['spark', 'zeal', 'life', 'worship', 'legacy']

export function phaseRank(phase: Phase): number {
  return PHASE_ORDER.indexOf(phase)
}

/** The act the world itself says we are in. Never reaches the ending. */
function derivedPhase(world: WorldState, progress: Progress): Phase {
  if (world.cities >= CITY_THRESHOLD) return 'worship'
  if (world.life >= LIFE_THRESHOLD) return 'life'
  if (progress.overshoots + progress.interruptions > 0) return 'zeal'
  return 'spark'
}

export interface AdvanceInput {
  previousWorld: WorldState
  world: WorldState
  progress: Progress
  crisisSurvived: boolean
}

export interface AdvanceResult {
  progress: Progress
  /** Gauges revealed by this tick, so they can appear one at a time. */
  unlocked: Vital[]
  /** Achievement ids earned by this tick. */
  achievements: string[]
  changed: boolean
}

export function advanceProgress({
  previousWorld,
  world,
  progress,
  crisisSurvived,
}: AdvanceInput): AdvanceResult {
  const unlocked = unlockedIndicators(progress, previousWorld, world)

  const context: ProgressContext = {
    world,
    peaceSeconds: world.age,
    crisisSurvived,
    overshoots: progress.overshoots,
    interruptions: progress.interruptions,
    commandments: progress.commandments.length,
    userName: progress.userName,
    planetName: progress.planetName,
  }
  const earned = newAchievements(progress.achievements, context)

  const indicators = unlocked.length
    ? [...progress.indicators, ...unlocked]
    : progress.indicators

  // Acts only ever move forward, and the ending is not reachable from here.
  const derived = derivedPhase(world, progress)
  const phase =
    phaseRank(derived) > phaseRank(progress.phase) ? derived : progress.phase

  const changed =
    unlocked.length > 0 || earned.length > 0 || phase !== progress.phase

  return {
    progress: changed
      ? {
          ...progress,
          phase,
          indicators,
          ageUnlocked: phaseRank(phase) >= phaseRank('life'),
          achievements: [
            ...progress.achievements,
            ...earned.map((achievement) => achievement.id),
          ],
        }
      : progress,
    unlocked,
    achievements: earned.map((achievement) => achievement.id),
    changed,
  }
}

/** Union of two progressions, used when a server update meets local progress. */
export function mergeProgress(local: Progress, remote: Progress): Progress {
  const phase =
    phaseRank(remote.phase) >= phaseRank(local.phase) ? remote.phase : local.phase
  const indicators = [...local.indicators]
  for (const vital of remote.indicators) {
    if (!indicators.includes(vital)) indicators.push(vital)
  }
  const achievements = [...local.achievements]
  for (const id of remote.achievements) {
    if (!achievements.includes(id)) achievements.push(id)
  }
  // The scripture is the server's, in the server's order: it is the only part
  // of the progression a browser can never derive on its own.
  return {
    phase,
    indicators,
    ageUnlocked: local.ageUnlocked || remote.ageUnlocked,
    achievements,
    commandments: remote.commandments.length
      ? remote.commandments
      : local.commandments,
    overshoots: Math.max(local.overshoots, remote.overshoots),
    interruptions: Math.max(local.interruptions, remote.interruptions),
    userName: remote.userName ?? local.userName,
    planetName: remote.planetName ?? local.planetName,
  }
}
