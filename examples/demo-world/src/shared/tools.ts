import { z } from 'zod'
import { SurgeField } from './protocol'
import { Palette, WorldState, clamp } from './world'

/**
 * The surface the LLM is allowed to touch. Kept small, and expressed as
 * relative nudges rather than absolute numbers, because a model asked for "a
 * bit more water" is reliable while a model asked for "water: 0.52" is not.
 */

export const TOOL_SHAPE = 'shape_world'
export const TOOL_EVENT = 'trigger_event'
export const TOOL_LOOK = 'look_at'
export const TOOL_REMEMBER = 'remember_name'
export const TOOL_NAME = 'name_planet'
export const TOOL_COMMANDMENT = 'carve_commandment'

export const adjustSchema = z.enum(['much_less', 'less', 'more', 'much_more'])
export type Adjust = z.infer<typeof adjustSchema>

export const ADJUST_DELTA: Record<Adjust, number> = {
  much_less: -0.28,
  less: -0.11,
  more: 0.11,
  much_more: 0.28,
}

export const PALETTES: Palette[] = [
  'ember',
  'ash',
  'ice',
  'ocean',
  'forest',
  'desert',
  'twilight',
]

/** The six numbers a gesture can push around. */
export const SHAPE_FIELDS = [
  'heat',
  'breath',
  'water',
  'roughness',
  'vegetation',
  'creatures',
] as const
export type ShapeField = (typeof SHAPE_FIELDS)[number]

/**
 * Every field is nullable rather than optional, and null means "leave this
 * alone".
 *
 * OpenAI runs tool schemas in strict mode, which requires every property to
 * appear in `required`; optionality has to be expressed as a nullable type or
 * the call is rejected outright. Numeric bounds are left out for the same
 * reason and enforced in applyShape instead.
 */
export const shapeWorldSchema = z.object({
  heat: adjustSchema.nullable().describe('Warmth of the whole planet'),
  breath: adjustSchema.nullable().describe('Thickness of the atmosphere'),
  water: adjustSchema.nullable().describe('Amount of water on the surface'),
  roughness: adjustSchema.nullable().describe('How jagged the terrain is'),
  vegetation: adjustSchema.nullable().describe('How much green covers her'),
  creatures: adjustSchema.nullable().describe('How much wildlife moves on her'),
  palette: z
    .enum(['ember', 'ash', 'ice', 'ocean', 'forest', 'desert', 'twilight'])
    .nullable()
    .describe('Overall colour mood of the world'),
  moons: z.number().nullable().describe('How many moons, from zero to three'),
  rings: z.boolean().nullable(),
  auroras: z.boolean().nullable(),
})

/** Callers inside the demo pass whichever fields they mean to change. */
export type ShapeWorldInput = Partial<z.infer<typeof shapeWorldSchema>>

export const triggerEventSchema = z.object({
  event: z.enum(['meteor', 'flare', 'eruption', 'freeze']),
})

export const lookAtSchema = z.object({
  target: z.enum(['whole', 'surface', 'sky', 'night', 'far', 'star']),
})

export const rememberNameSchema = z.object({
  name: z.string().describe('The first name the user just gave'),
})

export const namePlanetSchema = z.object({
  name: z.string().describe('The name the user just gave to the planet'),
})

export const carveCommandmentSchema = z.object({
  text: z
    .string()
    .describe(
      'The sentence the people carved, eight words at most'
    ),
})

/**
 * Turns a nudge into a world. Shared by the server and by the test page's fake
 * server, so what the buttons exercise is the very code a tool call runs.
 */
export function applyShape(
  world: WorldState,
  input: ShapeWorldInput
): WorldState {
  const next = { ...world }
  for (const field of SHAPE_FIELDS) {
    const adjust = input[field]
    if (adjust) next[field] = clamp(next[field] + ADJUST_DELTA[adjust])
  }

  // null and undefined both mean "not this time", so every check is loose.
  if (input.palette) next.palette = input.palette
  if (input.moons != null) {
    next.moons = Math.min(3, Math.max(0, Math.round(input.moons)))
  }
  if (input.rings != null) next.rings = input.rings
  if (input.auroras != null) next.auroras = input.auroras

  // Green appearing on its own is life, so the two never disagree.
  if (input.vegetation && next.vegetation > next.life) {
    next.life = Math.max(next.life, next.vegetation * 0.8)
  }
  return next
}

/**
 * What a gesture drags along with it when nobody stops her.
 *
 * She has no notion of a side effect, so hers are the naive ones: heat boils
 * the water off, water thickens the sky, animals eat the forest they were given.
 * They are what turns a granted wish into the next problem.
 */
const COLLATERAL: Record<ShapeField, { up: ShapeField; down: ShapeField }> = {
  heat: { up: 'water', down: 'water' },
  breath: { up: 'heat', down: 'heat' },
  water: { up: 'breath', down: 'vegetation' },
  roughness: { up: 'water', down: 'creatures' },
  vegetation: { up: 'creatures', down: 'creatures' },
  creatures: { up: 'vegetation', down: 'vegetation' },
}

/** Which way the collateral goes, given the direction of the gesture. */
const COLLATERAL_SIGN: Record<ShapeField, number> = {
  heat: -1,
  breath: 1,
  water: 1,
  roughness: -1,
  vegetation: 1,
  creatures: -1,
}

/**
 * The second half of a gesture, the half nobody asked for.
 *
 * It doubles down in the direction that was requested and drags one neighbour
 * with it. Deterministic on purpose: the browser's fake server runs this exact
 * function, so the test bench and a live call produce the same planet from the
 * same words.
 */
export function applyOvershoot(
  world: WorldState,
  input: ShapeWorldInput
): WorldState {
  // The shove does not scale with what was asked for, and that is the joke: a
  // timid request and a bold one end in the same place, because the size of the
  // gesture was never the user's to choose. It does not scale with anything
  // else either: she overdoes it by exactly as much every time, and what that
  // costs depends only on how far the number already was from its limit.
  const shove = 0.45
  const drag = 0.19
  const next = { ...world }

  for (const field of SHAPE_FIELDS) {
    const adjust = input[field]
    if (!adjust) continue
    const way = Math.sign(ADJUST_DELTA[adjust])
    next[field] = clamp(next[field] + way * shove)

    const target = COLLATERAL[field][way > 0 ? 'up' : 'down']
    next[target] = clamp(next[target] + way * COLLATERAL_SIGN[field] * drag)
  }

  // Ornaments get the same treatment: one moon becomes two, a ring brings the
  // lights along with it.
  if (input.moons != null) {
    next.moons = Math.min(3, Math.max(0, Math.round(input.moons) + 1))
  }
  if (input.rings) next.auroras = true

  if (next.vegetation > next.life) {
    next.life = Math.max(next.life, next.vegetation * 0.8)
  }
  return next
}

/** Which numbers a gesture is about, for the interface that has to show it. */
export function shapeFields(input: ShapeWorldInput): string[] {
  const fields: string[] = SHAPE_FIELDS.filter((field) => Boolean(input[field]))
  if (input.palette) fields.push('palette')
  if (input.moons != null) fields.push('moons')
  if (input.rings != null) fields.push('rings')
  if (input.auroras != null) fields.push('auroras')
  return fields
}

/**
 * The same fields, each with the direction it is being pushed in.
 *
 * The interface says what she is doing out loud, and a gesture that cools her
 * down must not be announced as one that warms her up, so the direction travels
 * with the gesture rather than being guessed from the numbers.
 */
export function surgeFields(
  world: WorldState,
  input: ShapeWorldInput
): SurgeField[] {
  return shapeFields(input).map((id) => ({ id, up: rises(world, input, id) }))
}

function rises(
  world: WorldState,
  input: ShapeWorldInput,
  field: string
): boolean {
  if (field === 'moons') return (input.moons ?? 0) > world.moons
  if (field === 'rings') return Boolean(input.rings)
  if (field === 'auroras') return Boolean(input.auroras)
  // A change of colours goes neither up nor down, and reads as a change.
  if (field === 'palette') return true
  const adjust = input[field as ShapeField]
  return adjust ? ADJUST_DELTA[adjust] > 0 : true
}
