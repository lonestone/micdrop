import { Color } from 'three'
import { Palette } from '../../shared/world'

/**
 * Seven moods, each a small set of colours the shader ramps between. Changing
 * the mood of a whole world costs one word in a tool call.
 *
 * The ground is always bare: rock, sand, ash or ice, never green. Green is what
 * life paints on top, and a palette that is already green makes vegetation
 * invisible however much of it grows.
 */
export interface PaletteColors {
  deep: Color
  shallow: Color
  low: Color
  high: Color
  peak: Color
  sky: Color
  star: Color
}

const build = (
  deep: string,
  shallow: string,
  low: string,
  high: string,
  peak: string,
  sky: string,
  star: string
): PaletteColors => ({
  deep: new Color(deep),
  shallow: new Color(shallow),
  low: new Color(low),
  high: new Color(high),
  peak: new Color(peak),
  sky: new Color(sky),
  star: new Color(star),
})

export const PALETTES: Record<Palette, PaletteColors> = {
  ember: build(
    '#3a0d05',
    '#7a1e08',
    '#993217',
    '#c25a1e',
    '#f0a04b',
    '#ff7a3d',
    '#ffcf8a'
  ),
  ash: build(
    '#1a1a24',
    '#31313e',
    '#3a3a44',
    '#55555f',
    '#8a8a94',
    '#6b6f7a',
    '#cfd4dd'
  ),
  ice: build(
    '#0d3350',
    '#1a5c85',
    '#5d8ba6',
    '#b3d8e9',
    '#f2fbff',
    '#7fc4e8',
    '#eaf6ff'
  ),
  ocean: build(
    '#04365f',
    '#0d72a8',
    '#6b6154',
    '#9c8f7b',
    '#e6f0e2',
    '#4fb3d9',
    '#fff3d6'
  ),
  forest: build(
    '#063a5e',
    '#0e7f96',
    '#6a5a42',
    '#9d8d6c',
    '#dfe6c4',
    '#79c98f',
    '#ffeec2'
  ),
  desert: build(
    '#123c4d',
    '#1f6f82',
    '#9c6b2a',
    '#d9a45a',
    '#f6e2b3',
    '#e8b06a',
    '#fff0c9'
  ),
  twilight: build(
    '#1a0d3d',
    '#3d2075',
    '#4a2170',
    '#8a4bab',
    '#e5c6f2',
    '#a86ad6',
    '#ffd9f0'
  ),
}

export function paletteOf(palette: Palette): PaletteColors {
  return PALETTES[palette] ?? PALETTES.ember
}
