import { ACHIEVEMENTS } from '../../shared/achievements'
import { INDICATORS, Phase } from '../../shared/indicators'
import { DEFAULT_LANG } from '../../shared/lang'
import { VITALS, Vital } from '../../shared/world'
import { useWorldSnapshot } from '../store/hooks'
import { Status, worldStore } from '../store/WorldStore'
import { Row, Section, TestButton } from './Panel'

const STATUSES: Status[] = ['offline', 'listening', 'thinking', 'speaking']
const PHASES: Phase[] = ['spark', 'zeal', 'life', 'worship', 'legacy']

/** Interface state that has nothing to do with the world itself. */
export default function StatePanel() {
  const { status, progress } = useWorldSnapshot()

  const toggleIndicator = (vital: Vital) => {
    const has = progress.indicators.includes(vital)
    worldStore.setProgress({
      indicators: has
        ? progress.indicators.filter((item) => item !== vital)
        : [...progress.indicators, vital],
    })
  }

  return (
    <>
      <Section title="statut">
        <Row>
          {STATUSES.map((value) => (
            <TestButton
              key={value}
              label={value}
              active={status === value}
              onClick={() => worldStore.setStatus(value)}
            />
          ))}
        </Row>
      </Section>

      <Section title="sous-titre">
        <Row>
          <TestButton
            label="elle parle"
            onClick={() =>
              worldStore.setSubtitle({
                text: 'Voilà. Il y a de l’eau partout. Tu n’avais pas dit combien.',
                from: 'planet',
              })
            }
          />
          <TestButton
            label="phrase longue"
            onClick={() =>
              worldStore.setSubtitle({
                text: 'J’allais en mettre beaucoup plus, et tu m’as arrêtée. Bon. C’est toi qui vois.',
                from: 'planet',
              })
            }
          />
          <TestButton
            label="la personne"
            onClick={() =>
              worldStore.setSubtitle({
                text: 'Non, non, moins d’eau, arrête tout de suite.',
                from: 'user',
              })
            }
          />
          <TestButton
            label="les gens"
            onClick={() =>
              worldStore.setSubtitle({
                text: 'Ils ont inventé une fête. Elle consiste à répéter ton nom en montant sur des collines.',
                from: 'people',
              })
            }
          />
          <TestButton label="rien" onClick={() => worldStore.setSubtitle(undefined)} />
        </Row>
      </Section>

      <Section title="phase">
        <Row>
          {PHASES.map((phase) => (
            <TestButton
              key={phase}
              label={phase}
              active={progress.phase === phase}
              onClick={() =>
                worldStore.setProgress({
                  phase,
                  ageUnlocked: phase !== 'spark' && phase !== 'zeal',
                })
              }
            />
          ))}
        </Row>
      </Section>

      <Section title="jauges">
        <Row>
          {VITALS.map((vital) => (
            <TestButton
              key={vital}
              label={INDICATORS[vital].label[DEFAULT_LANG]}
              active={progress.indicators.includes(vital)}
              onClick={() => toggleIndicator(vital)}
            />
          ))}
          <TestButton
            label="âge"
            active={progress.ageUnlocked}
            onClick={() => worldStore.setProgress({ ageUnlocked: !progress.ageUnlocked })}
          />
        </Row>
      </Section>

      <Section title="écritures">
        <Row>
          <TestButton
            label="ajouter une pierre"
            onClick={() =>
              worldStore.setProgress({
                commandments: [
                  ...progress.commandments,
                  `PIERRE NUMÉRO ${progress.commandments.length + 1}`,
                ],
              })
            }
          />
          <TestButton
            label="tout effacer"
            onClick={() => worldStore.setProgress({ commandments: [] })}
          />
        </Row>
      </Section>

      <Section title="souvenirs">
        <Row>
          {ACHIEVEMENTS.map((achievement) => (
            <TestButton
              key={achievement.id}
              label={achievement.label[DEFAULT_LANG]}
              active={progress.achievements.includes(achievement.id)}
              onClick={() =>
                worldStore.setProgress({
                  achievements: progress.achievements.includes(achievement.id)
                    ? progress.achievements.filter((id) => id !== achievement.id)
                    : [...progress.achievements, achievement.id],
                })
              }
            />
          ))}
        </Row>
      </Section>
    </>
  )
}
