import { encodeWorld } from '../../shared/world'
import { worldStore } from '../store/WorldStore'
import { Row, Section, TestButton } from './Panel'
import { PRESETS } from './presets'

/** Jump straight to a moment of the arc, or copy the link to the one on screen. */
export default function PresetPanel() {
  const handleCopy = () => {
    const link = `${location.origin}${location.pathname}#${encodeWorld(worldStore.world())}`
    navigator.clipboard?.writeText(link)
  }

  return (
    <Section title="états de référence">
      <Row>
        {PRESETS.map((preset) => (
          <TestButton
            key={preset.id}
            label={preset.label}
            onClick={() => worldStore.setWorld(preset.world)}
          />
        ))}
        <TestButton label="copier le lien" onClick={handleCopy} />
      </Row>
    </Section>
  )
}
