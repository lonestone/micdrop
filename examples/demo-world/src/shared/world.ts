/**
 * The world model, shared by the server (authoritative) and the browser (mirror).
 *
 * Everything the planet is fits in this object, which is why a whole world can
 * travel inside a tool call and be restored from a URL.
 */

export const VITALS = ['heat', 'breath', 'water', 'life'] as const
export type Vital = (typeof VITALS)[number]

export type Palette =
  | 'ember'
  | 'ash'
  | 'ice'
  | 'ocean'
  | 'forest'
  | 'desert'
  | 'twilight'

export interface WorldState {
  /** Vital signs, 0 to 1, each with a comfort band (see COMFORT). */
  heat: number
  breath: number
  water: number
  life: number

  /** Terrain and looks. */
  seed: number
  palette: Palette
  roughness: number
  vegetation: number
  creatures: number
  clouds: number

  /**
   * How far the people have spread. It lights her night side, and it thickens
   * her air, so the thing that admires her is also the thing that smothers her.
   */
  cities: number

  /** Sky ornaments. */
  moons: number
  rings: boolean
  auroras: boolean

  /** Time she has lived through in comfort, in seconds. Only ever rises. */
  age: number
}

/** The band each vital is happy inside. Full is not better than right. */
export const COMFORT: Record<Vital, [number, number]> = {
  heat: [0.4, 0.62],
  breath: [0.35, 0.65],
  water: [0.4, 0.7],
  life: [0.3, 1],
}

export const INITIAL_WORLD: WorldState = {
  heat: 0.95,
  breath: 0.06,
  water: 0.02,
  life: 0,
  seed: 1,
  palette: 'ember',
  roughness: 0.55,
  vegetation: 0,
  creatures: 0,
  clouds: 0.05,
  cities: 0,
  moons: 0,
  rings: false,
  auroras: false,
  age: 0,
}

export const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value))

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/**
 * How far a vital sits outside its comfort band, 0 when comfortable and 1 when
 * as wrong as it can be.
 */
export function strain(state: WorldState, vital: Vital): number {
  const [min, max] = COMFORT[vital]
  const value = state[vital]
  if (value < min) return (min - value) / (min || 1)
  if (value > max) return (value - max) / (1 - max || 1)
  return 0
}

export function isComfortable(state: WorldState, vital: Vital): boolean {
  return strain(state, vital) === 0
}

/** Overall wellbeing, 0 to 1. Drives colour, breathing rhythm and light. */
export function health(state: WorldState): number {
  const total = VITALS.reduce((sum, vital) => sum + strain(state, vital), 0)
  return clamp(1 - total / VITALS.length)
}

/** True when everything sits in its band, which is when she can rest. */
export function isAtPeace(state: WorldState): boolean {
  return VITALS.every((vital) => isComfortable(state, vital))
}

/**
 * Compact form used in the share URL.
 *
 * Order matters. The six flags are read from the end rather than from a fixed
 * offset, so a number can leave the middle of the list without shortening the
 * life of the links that still carry it.
 */
export function encodeWorld(state: WorldState): string {
  const numbers = [
    state.heat,
    state.breath,
    state.water,
    state.life,
    state.roughness,
    state.vegetation,
    state.creatures,
    state.clouds,
    state.cities,
  ].map((value) =>
    Math.round(clamp(value) * 99)
      .toString(36)
      .padStart(2, '0')
  )
  const flags = [
    state.seed.toString(36),
    state.palette,
    state.moons,
    state.rings ? 1 : 0,
    state.auroras ? 1 : 0,
    Math.round(state.age),
  ]
  return [...numbers, ...flags].join('.')
}

const FLAG_COUNT = 6

export function decodeWorld(encoded: string): WorldState | undefined {
  const parts = encoded.split('.')

  // Three generations of link, told apart by how many numbers they carry.
  // Eight is from before the people existed, ten still carries the gauge that
  // used to scale her excesses. Both describe a whole planet, so both keep
  // opening, and the extra number is simply read past.
  const numbers = parts.length - FLAG_COUNT
  if (numbers < 8 || numbers > 10) return undefined

  const num = (index: number) => parseInt(parts[index], 36) / 99
  const flag = (index: number) => parts[numbers + index]

  return {
    heat: num(0),
    breath: num(1),
    water: num(2),
    life: num(3),
    roughness: num(4),
    vegetation: num(5),
    creatures: num(6),
    clouds: num(7),
    cities: numbers >= 9 ? num(8) : 0,
    seed: parseInt(flag(0), 36) || 1,
    palette: flag(1) as Palette,
    moons: Number(flag(2)) || 0,
    rings: flag(3) === '1',
    auroras: flag(4) === '1',
    age: Number(flag(5)) || 0,
  }
}
