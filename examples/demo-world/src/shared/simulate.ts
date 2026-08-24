import { clamp, strain, isComfortable, isAtPeace, WorldState } from './world'

/**
 * The world keeps evolving between two sentences, and it does so without
 * spending a single token: this is a pure function of a base state and the time
 * elapsed since that state was set.
 *
 * The server and the browser both run it, from the same base, so they agree
 * without any synchronisation channel. Integration uses a fixed step so a
 * browser running it sixty times a second lands on exactly the same numbers as
 * a server running it once after ten seconds.
 */

export const SIM_STEP = 0.1 // seconds

/** One tenth of a second of little ecology. */
function step(state: WorldState, dt: number): WorldState {
  const next = { ...state }

  // Air holds warmth: the atmosphere decides the temperature it drifts towards.
  // The drift is deliberately slow, so her birth heat is a problem the user
  // solves rather than one that solves itself while they are still talking.
  const target = 0.18 + next.breath * 0.62
  next.heat = clamp(next.heat + (target - next.heat) * 0.02 * dt)

  // Heat above the comfort band boils the water away, cold locks it in ice.
  const overheating = strain({ ...next, heat: next.heat }, 'heat')
  if (next.heat > 0.62) {
    next.water = clamp(next.water - overheating * 0.02 * dt)
  }

  // Air leaks into space, plants make more of it.
  next.breath = clamp(next.breath - 0.0016 * dt + next.vegetation * 0.005 * dt)

  // Clouds are the visible part of the water.
  next.clouds = clamp(next.clouds + (next.water * 0.8 - next.clouds) * 0.06 * dt)

  // Life grows only when warmth, air and water agree, and it suffers otherwise.
  const livable =
    isComfortable(next, 'heat') &&
    isComfortable(next, 'breath') &&
    isComfortable(next, 'water')
  if (livable) {
    next.life = clamp(next.life + 0.022 * dt)
  } else {
    const suffering =
      strain(next, 'heat') + strain(next, 'breath') + strain(next, 'water')
    next.life = clamp(next.life - suffering * 0.05 * dt)
  }

  // Green spreads behind life, animals follow the green.
  next.vegetation = clamp(
    next.vegetation + (next.life * 0.95 - next.vegetation) * 0.05 * dt
  )
  next.creatures = clamp(
    next.creatures +
      ((next.vegetation > 0.3 ? next.life * 0.7 : 0) - next.creatures) *
        0.04 *
        dt
  )

  // Then something in the herd starts building. A civilisation only appears
  // where something already moves, and once it has started it feeds itself.
  if (next.creatures > 0.3 && livable) {
    next.cities = clamp(next.cities + (0.006 + next.cities * 0.012) * dt)
  } else {
    // They leave slowly. A civilisation that vanished in half a minute made
    // the whole third act feel like it had never happened.
    next.cities = clamp(next.cities - 0.005 * dt)
  }

  // What they build thickens her air, and thicker air is warmer air. The last
  // act therefore arrives on its own: the more they love her, the less she
  // breathes, and nobody had to plan it.
  //
  // Squared and slow, deliberately. It has to be a squeeze somebody notices and
  // can still answer, not a wall the conversation runs into.
  next.breath = clamp(next.breath + next.cities * next.cities * 0.004 * dt)

  // She only ages while she is at peace, so age measures care, not duration.
  if (isAtPeace(next)) {
    next.age += dt
  }

  return next
}

/** Pure form. Always called with the base state and the total elapsed time. */
export function simulate(base: WorldState, elapsedSeconds: number): WorldState {
  const steps = Math.max(0, Math.floor(elapsedSeconds / SIM_STEP))
  let state = base
  for (let i = 0; i < steps; i++) {
    state = step(state, SIM_STEP)
  }
  return state
}

/**
 * Same result, but O(1) per call when time only moves forward, which is what a
 * render loop needs. Resets whenever the base state is replaced.
 */
export function createSimulator() {
  let base: WorldState | undefined
  let current: WorldState | undefined
  let doneSteps = 0

  return function simulateCached(
    nextBase: WorldState,
    elapsedSeconds: number
  ): WorldState {
    const steps = Math.max(0, Math.floor(elapsedSeconds / SIM_STEP))
    if (base !== nextBase || steps < doneSteps) {
      base = nextBase
      current = nextBase
      doneSteps = 0
    }
    while (doneSteps < steps) {
      current = step(current!, SIM_STEP)
      doneSteps++
    }
    return current!
  }
}
