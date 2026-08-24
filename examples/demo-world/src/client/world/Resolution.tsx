import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'

/**
 * Below this the image softens visibly, above it the extra pixels are hard to
 * tell apart on any screen this runs on.
 */
const FLOOR = 0.75
const CEILING = 1.5

/** Where a first frame starts, before anything is known about the machine. */
const INITIAL = Math.min(
  CEILING,
  typeof window === 'undefined' ? 1 : window.devicePixelRatio
)

/**
 * A screen dense enough that a jagged limb is already under a physical pixel,
 * which is the only reason multisampling was being paid for.
 */
export const DENSE_SCREEN =
  typeof window !== 'undefined' && window.devicePixelRatio >= 1.5

/**
 * How many frames are measured before the resolution is allowed to move.
 *
 * Rising is a slow decision and falling is an urgent one. Flying in to her
 * surface multiplies the pixels her shading is drawn over by three in a second
 * and a half, and a controller that needed four windows to notice spent the
 * first ten seconds of every close shot stuttering through a resolution it had
 * chosen for the wide one.
 */
const PATIENT = 45
const HASTY = 12

const STEP = 0.25
const TOO_SLOW = 1000 / 48
const ROOM_TO_SPARE = 1000 / 100

/** The frame the controller aims at when it works out how far to drop. */
const TARGET = 1000 / 60

/**
 * How many pixels the world is worth drawing at, decided by the machine drawing
 * it rather than guessed in advance.
 *
 * Her surface costs a dozen samples of noise per pixel, so resolution is by far
 * the largest number in the frame, and the right value for it swings by a
 * factor of four between a laptop on battery and a desktop card. Measuring the
 * machine is the only way to be both smooth on the small one and sharp on the
 * large one.
 *
 * The steps are coarse on purpose, and rising is deliberately slow: a
 * controller that reacts to a single good frame spends its life oscillating,
 * and a resolution that visibly breathes is worse than one that is simply a
 * little low. Falling is the other way round, because there the thing being
 * waited through is the stutter itself.
 */
export default function Resolution() {
  const setDpr = useThree((state) => state.setDpr)
  const frames = useRef(0)
  const elapsed = useRef(0)
  const current = useRef(INITIAL)

  // The canvas is deliberately given no dpr of its own. React Three Fiber
  // reapplies that prop on every render of the component holding the canvas,
  // which here happens whenever the camera changes target, and it would undo
  // whatever this controller had settled on. One owner, no argument.
  useLayoutEffect(() => setDpr(INITIAL), [setDpr])

  useFrame((_, delta) => {
    // A tab coming back from the background delivers one enormous frame, which
    // says nothing about the machine.
    if (delta > 0.5) return

    frames.current += 1
    elapsed.current += delta

    const average = (elapsed.current / frames.current) * 1000
    const slow = average > TOO_SLOW
    if (frames.current < (slow ? HASTY : PATIENT)) return

    frames.current = 0
    elapsed.current = 0

    let next = current.current
    if (slow) {
      // What a frame costs follows the number of pixels in it, which follows
      // the square of this number, so the value that lands on the budget is
      // known rather than approached one step at a time. Bounded to two steps
      // all the same, since part of every frame is not pixels at all and the
      // square would then ask for a drop that buys nothing.
      const wanted =
        Math.floor((current.current * Math.sqrt(TARGET / average)) / STEP) *
        STEP
      next = Math.max(
        FLOOR,
        Math.min(
          current.current - STEP,
          Math.max(current.current - 2 * STEP, wanted)
        )
      )
    } else if (average < ROOM_TO_SPARE) {
      next = Math.min(CEILING, current.current + STEP)
    }

    if (next !== current.current) {
      current.current = next
      setDpr(next)
    }
  })

  return null
}
