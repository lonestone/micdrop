import { Progress } from '../../shared/indicators'
import { dominantNeed } from '../../shared/needs'
import { advanceProgress } from '../../shared/progress'
import {
  CameraTarget,
  SCENE_EVENTS,
  SceneEventId,
  Surge,
  WorldUpdate,
  applyEventImpact,
} from '../../shared/protocol'
import { Phase } from '../../shared/indicators'
import { ShapeWorldInput, applyOvershoot, applyShape } from '../../shared/tools'
import { WorldState } from '../../shared/world'

export interface FakeChange {
  shape?: ShapeWorldInput
  /** The second half of a gesture, with the collateral it drags along. */
  overshoot?: ShapeWorldInput
  world?: Partial<WorldState>
  event?: SceneEventId
  look?: CameraTarget
  surge?: Surge
  chorus?: string
  commandment?: string
  countOvershoot?: boolean
  countInterruption?: boolean
  userName?: string
  planetName?: string
  phase?: Phase
}

/**
 * A client side replica of what WorldSession.commit does on the server.
 *
 * The test page goes through this rather than writing into the store directly,
 * so a button press exercises the exact same payload a real tool call produces,
 * including the overshoot and the progression it unlocks.
 */
export function fakeUpdate(
  base: { world: WorldState; progress: Progress; crisisSurvived?: boolean },
  change: FakeChange
): WorldUpdate {
  let world = base.world
  if (change.shape) world = applyShape(world, change.shape)
  if (change.overshoot) {
    world = applyOvershoot(world, change.overshoot)
  }
  if (change.world) world = { ...world, ...change.world }
  if (change.event) world = applyEventImpact(world, change.event)
  world = round(world)

  let progress = base.progress
  if (change.userName) progress = { ...progress, userName: change.userName }
  if (change.planetName) {
    progress = { ...progress, planetName: change.planetName }
  }
  if (change.commandment) {
    const carved = change.commandment.trim()
    if (!progress.commandments.includes(carved)) {
      progress = {
        ...progress,
        commandments: [...progress.commandments, carved],
      }
    }
  }
  if (change.countOvershoot) {
    progress = { ...progress, overshoots: progress.overshoots + 1 }
  }
  if (change.countInterruption) {
    progress = { ...progress, interruptions: progress.interruptions + 1 }
  }
  if (change.phase) progress = { ...progress, phase: change.phase }

  const result = advanceProgress({
    previousWorld: base.world,
    world,
    progress,
    crisisSurvived: base.crisisSurvived ?? false,
  })

  return {
    world,
    progress: result.progress,
    unlocked: result.unlocked,
    achievements: result.achievements,
    feeling: dominantNeed(world).hint,
    event: change.event ? SCENE_EVENTS[change.event] : undefined,
    look: change.look,
    surge: change.surge,
    chorus: change.chorus,
  }
}

function round(world: WorldState): WorldState {
  const next = { ...world }
  for (const key of Object.keys(next) as (keyof WorldState)[]) {
    const value = next[key]
    if (typeof value === 'number' && key !== 'moons' && key !== 'seed') {
      ;(next as any)[key] = Math.round(value * 100) / 100
    }
  }
  return next
}
