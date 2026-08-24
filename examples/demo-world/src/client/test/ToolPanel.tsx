import { CameraTarget, SceneEventId } from '../../shared/protocol'
import { Adjust, SHAPE_FIELDS } from '../../shared/tools'
import { interruptGesture, playGesture, send } from '../drivers/gesture'
import { worldStore } from '../store/WorldStore'
import { Row, Section, TestButton } from './Panel'

const ADJUSTS: Adjust[] = ['much_less', 'less', 'more', 'much_more']
const LOOKS: CameraTarget[] = ['whole', 'surface', 'sky', 'night', 'far', 'star']
const EVENTS: SceneEventId[] = ['meteor', 'flare', 'eruption', 'freeze']
const SHORT: Record<Adjust, string> = {
  much_less: '- -',
  less: '-',
  more: '+',
  much_more: '+ +',
}

const CHORUS = [
  'Ils ont gravé une pierre. Dessus, il y a une phrase que tu as dite, en plus grand.',
  'Ils demandent un signe. Ils insistent, et je ne sais pas quoi leur montrer.',
]

/**
 * Fires real tool payloads, through the same commit path the server uses, so
 * pressing a button here is indistinguishable from the model calling the tool.
 *
 * Every shape button plays the gesture whole, charge included, because the half
 * nobody asked for is the part worth testing.
 */
export default function ToolPanel() {
  return (
    <>
      <Section title="shape_world, geste complet">
        {SHAPE_FIELDS.map((field) => (
          <div key={field} className="flex items-center gap-2">
            <span className="w-20 shrink-0 text-xs text-[#8d8aa0]">{field}</span>
            <Row>
              {ADJUSTS.map((adjust) => (
                <TestButton
                  key={adjust}
                  label={SHORT[adjust]}
                  onClick={() => playGesture({ [field]: adjust })}
                />
              ))}
            </Row>
          </div>
        ))}
        <Row>
          <TestButton label="la couper" onClick={() => interruptGesture()} />
          <TestButton
            label="geste + coupure auto"
            onClick={() =>
              playGesture({ water: 'more' }, { interruptAfter: 2.2 })
            }
          />
        </Row>
        <Row>
          {(
            ['ember', 'ash', 'ice', 'ocean', 'forest', 'desert', 'twilight'] as const
          ).map((palette) => (
            <TestButton
              key={palette}
              label={palette}
              onClick={() => send({ shape: { palette } })}
            />
          ))}
        </Row>
        <Row>
          {[0, 1, 2, 3].map((moons) => (
            <TestButton
              key={moons}
              label={`${moons} lune${moons > 1 ? 's' : ''}`}
              onClick={() => send({ shape: { moons } })}
            />
          ))}
          <TestButton
            label="anneaux"
            onClick={() => send({ shape: { rings: !worldStore.world().rings } })}
          />
          <TestButton
            label="aurores"
            onClick={() => send({ shape: { auroras: !worldStore.world().auroras } })}
          />
        </Row>
      </Section>

      <Section title="look_at">
        <Row>
          {LOOKS.map((target) => (
            <TestButton
              key={target}
              label={target}
              onClick={() => send({ look: target })}
            />
          ))}
        </Row>
      </Section>

      <Section title="trigger_event">
        <Row>
          {EVENTS.map((event) => (
            <TestButton key={event} label={event} onClick={() => send({ event })} />
          ))}
        </Row>
      </Section>

      <Section title="la civilisation">
        <Row>
          <TestButton
            label="carve_commandment"
            onClick={() =>
              send({
                commandment: 'Fais quelque chose de joli',
                look: 'night',
              })
            }
          />
          <TestButton
            label="deuxième pierre"
            onClick={() => send({ commandment: 'Ne nous noie pas deux fois' })}
          />
          {CHORUS.map((line, index) => (
            <TestButton
              key={index}
              label={`ils parlent ${index + 1}`}
              onClick={() => send({ chorus: line, look: 'night' })}
            />
          ))}
        </Row>
      </Section>

      <Section title="mémoire">
        <Row>
          <TestButton
            label="remember_name"
            onClick={() => send({ userName: 'Godefroy' })}
          />
          <TestButton
            label="name_planet"
            onClick={() => send({ planetName: 'Rien-du-Tout' })}
          />
        </Row>
      </Section>
    </>
  )
}
