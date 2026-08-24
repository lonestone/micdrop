/**
 * Where her star sits, shared by everything that has to agree on it: the light,
 * the terminator on her surface, the glow on her atmosphere and the lit side of
 * her weather.
 *
 * The offset from the default camera matters. Put the star behind the eye and
 * the planet is flatly lit and the star is never in frame; put it at right
 * angles and half the world is night. A little under fifty degrees leaves her
 * mostly lit, gives a terminator to read her shape by, and lets the star drift
 * into view as the camera turns.
 */
export const SUN_DIRECTION: [number, number, number] = [0.35, 0.42, 0.84]

/** Far enough to read as a star rather than a lamp. */
export const SUN_DISTANCE = 28
