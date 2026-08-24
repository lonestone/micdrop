import { WorldState } from '../../shared/world'

/**
 * The key states of the arc, reachable in one click.
 *
 * They double as documentation: this is what each act is supposed to look like,
 * which makes a regression in the shader or the palette obvious.
 */
export interface Preset {
  id: string
  label: string
  world: Partial<WorldState>
}

export const PRESETS: Preset[] = [
  {
    id: 'birth',
    label: 'naissance',
    world: {
      heat: 0.95,
      breath: 0.06,
      water: 0.02,
      life: 0,
      vegetation: 0,
      creatures: 0,
      clouds: 0.05,
      cities: 0,
      palette: 'ember',
      roughness: 0.55,
      moons: 0,
      rings: false,
      auroras: false,
      age: 0,
    },
  },
  {
    id: 'drowned',
    label: 'elle en a trop fait',
    world: {
      heat: 0.46,
      breath: 0.78,
      water: 0.96,
      life: 0.2,
      vegetation: 0.08,
      creatures: 0.05,
      clouds: 0.85,
      cities: 0,
      palette: 'ocean',
      age: 0,
    },
  },
  {
    id: 'cooling',
    label: 'elle refroidit',
    world: {
      heat: 0.66,
      breath: 0.28,
      water: 0.22,
      life: 0,
      vegetation: 0,
      creatures: 0,
      clouds: 0.18,
      cities: 0,
      palette: 'desert',
      age: 0,
    },
  },
  {
    id: 'lush',
    label: 'luxuriante',
    world: {
      heat: 0.5,
      breath: 0.52,
      water: 0.55,
      life: 0.92,
      vegetation: 0.88,
      creatures: 0.72,
      clouds: 0.45,
      cities: 0.04,
      palette: 'forest',
      moons: 2,
      rings: true,
      auroras: true,
      age: 60,
    },
  },
  {
    id: 'inhabited',
    label: 'habitée',
    world: {
      heat: 0.52,
      breath: 0.58,
      water: 0.58,
      life: 0.95,
      vegetation: 0.8,
      creatures: 0.75,
      clouds: 0.5,
      cities: 0.55,
      palette: 'forest',
      moons: 1,
      auroras: true,
      age: 140,
    },
  },
  {
    id: 'smog',
    label: 'ils l’étouffent',
    world: {
      heat: 0.72,
      breath: 0.86,
      water: 0.5,
      life: 0.6,
      vegetation: 0.5,
      creatures: 0.45,
      clouds: 0.72,
      cities: 0.82,
      palette: 'desert',
      age: 180,
    },
  },
  {
    id: 'frozen',
    label: 'gelée',
    world: {
      heat: 0.12,
      breath: 0.18,
      water: 0.35,
      life: 0.05,
      vegetation: 0.02,
      creatures: 0,
      cities: 0,
      clouds: 0.2,
      palette: 'ice',
      age: 20,
    },
  },
  {
    id: 'after',
    label: 'après la crise',
    world: {
      heat: 0.82,
      breath: 0.2,
      water: 0.18,
      life: 0.12,
      vegetation: 0.08,
      creatures: 0.03,
      cities: 0.1,
      clouds: 0.15,
      palette: 'ash',
      age: 60,
    },
  },
]
