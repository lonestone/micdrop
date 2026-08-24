/**
 * Frame rate independent smoothing.
 *
 * Every value the scene displays trails the simulated one, which is what makes
 * a transformation unfold over several seconds while she is still speaking
 * rather than snapping into place after she has finished.
 */
export function damp(
  current: number,
  target: number,
  lambda: number,
  dt: number
): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt))
}

/** Slower for anything that reads as geological, faster for light and colour. */
export const SLOW = 0.35
export const MEDIUM = 0.9
export const FAST = 2.5
