import { WorldState } from '../../shared/world'
import { useAnimatedWorld } from '../store/hooks'
import { worldStore } from '../store/WorldStore'
import { Section, Slider } from './Panel'

const SLIDERS: Array<[keyof WorldState, string]> = [
  ['heat', 'chaud'],
  ['breath', 'souffle'],
  ['water', 'eau'],
  ['life', 'vie'],
  ['vegetation', 'végétation'],
  ['creatures', 'faune'],
  ['cities', 'villes'],
  ['clouds', 'nuages'],
  ['roughness', 'relief'],
]

/**
 * Raw access to the model, bypassing the tools. Useful to sit on an exact value
 * and watch what the shader and the simulation do with it.
 *
 * Anything a tool can already set lives in the tool panel and only there:
 * palette, moons, rings and auroras used to appear in both places, which made
 * the bench look like it had two of everything.
 */
export default function WorldPanel() {
  const world = useAnimatedWorld(120)

  return (
    <Section title="état brut">
      {SLIDERS.map(([field, label]) => (
        <Slider
          key={field}
          label={label}
          value={world[field] as number}
          onChange={(value) => worldStore.setWorld({ [field]: value })}
        />
      ))}
      <Slider
        label="graine"
        min={1}
        max={40}
        step={1}
        value={world.seed}
        onChange={(seed) => worldStore.setWorld({ seed })}
      />
      <Slider
        label="âge"
        min={0}
        max={200}
        step={1}
        value={world.age}
        onChange={(age) => worldStore.setWorld({ age })}
      />
    </Section>
  )
}
