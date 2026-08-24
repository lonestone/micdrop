/**
 * One source of truth for how far each shell sits from her centre.
 *
 * The terrain grows with roughness, so anything drawn above it has to grow with
 * it too. Hard coding a cloud radius means mountains eventually poke through
 * the weather, which reads as a bug even when nobody can name it.
 */

/** How much of the radius the relief is allowed to take. */
export const TERRAIN_AMPLITUDE = 0.075

/**
 * The highest the noise sum realistically reaches. The theoretical bound is
 * near one, but the octaves never all saturate at once, and using the bound
 * would push the sky absurdly far out.
 */
export const MAX_ELEV = 0.72

/** Radius of the tallest peak this roughness can produce. */
export function peakRadius(roughness: number): number {
  return 1 + MAX_ELEV * TERRAIN_AMPLITUDE * (0.45 + roughness)
}

/** Weather always sits above the mountains, at a constant relative height. */
export function cloudRadius(roughness: number): number {
  return peakRadius(roughness) + 0.014
}

/** The shockwave rides between the summits and the clouds. */
export function waveRadius(roughness: number): number {
  return peakRadius(roughness) + 0.006
}

/**
 * The air, which is thin.
 *
 * The shell's own silhouette is where the glow peaks, so putting it far out
 * draws a bright ring detached from the ground and the whole thing reads as a
 * second sphere of glass rather than as atmosphere. It hugs the surface, and it
 * swells with the breath so a thick atmosphere is visible on the silhouette and
 * not only in the brightness.
 */
export function atmosphereRadius(roughness: number, breath: number): number {
  return peakRadius(roughness) + 0.025 + breath * 0.07
}
