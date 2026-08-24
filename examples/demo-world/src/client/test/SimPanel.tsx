import { DEFAULT_LANG } from '../../shared/lang'
import { activeNeeds, dominantNeed } from '../../shared/needs'
import { health, isAtPeace } from '../../shared/world'
import { useAnimatedWorld, useWorldSnapshot } from '../store/hooks'
import { worldStore } from '../store/WorldStore'
import { Row, Section, TestButton } from './Panel'

const SPEEDS = [0, 1, 4, 20]

/**
 * The simulation runs whether anyone speaks or not, so being able to fast
 * forward it is the only way to see erosion, growth and ageing without waiting
 * out the real minutes they take.
 */
export default function SimPanel() {
  const { simSpeed, paused } = useWorldSnapshot()
  const world = useAnimatedWorld(150)
  const need = dominantNeed(world)

  return (
    <>
      <Section title="simulation">
        <Row>
          {SPEEDS.map((speed) => (
            <TestButton
              key={speed}
              label={speed === 0 ? 'pause' : `${speed}x`}
              active={speed === 0 ? paused : !paused && simSpeed === speed}
              onClick={() => {
                if (speed === 0) {
                  worldStore.setPaused(!paused)
                } else {
                  worldStore.setPaused(false)
                  worldStore.setSimSpeed(speed)
                }
              }}
            />
          ))}
          <TestButton label="réinitialiser" onClick={worldStore.reset} />
        </Row>
      </Section>

      <Section title="ce qu’elle ressent">
        <p className="text-xs leading-relaxed text-[#b6b3c8]">{need.hint}</p>
        <p className="text-[11px] text-[#6f6c85]">
          santé {(health(world) * 100).toFixed(0)}%, âge {world.age.toFixed(1)}s,
          {isAtPeace(world) ? ' en paix' : ' en souffrance'}
        </p>
        <ul className="text-[11px] text-[#6f6c85]">
          {activeNeeds(world).map(({ need: item, severity }) => (
            <li key={item.id}>
              {item.id} · {(severity * 100).toFixed(0)}%
            </li>
          ))}
        </ul>
      </Section>

      <Section title="répliques de silence">
        <Row>
          <TestButton
            label="pensée"
            onClick={() =>
              worldStore.setSubtitle({ text: need.thoughts[DEFAULT_LANG][0], from: 'planet' })
            }
          />
          <TestButton
            label="besoin"
            onClick={() =>
              worldStore.setSubtitle({ text: need.needs[DEFAULT_LANG][0], from: 'planet' })
            }
          />
        </Row>
      </Section>
    </>
  )
}
