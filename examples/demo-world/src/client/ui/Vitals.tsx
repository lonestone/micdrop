import { INDICATORS } from '../../shared/indicators'
import { Vital, WorldState } from '../../shared/world'
import AgeMeter from './AgeMeter'
import VitalGauge from './VitalGauge'

interface VitalsProps {
  /** Only the gauges she has taught, in the order she taught them. */
  unlocked: Vital[]
  ageUnlocked: boolean
  world: WorldState
}

/** The gauges live in a corner and stay out of the way of her body. */
export default function Vitals({ unlocked, ageUnlocked, world }: VitalsProps) {
  if (!unlocked.length && !ageUnlocked) return null

  return (
    <div className="pointer-events-none absolute left-8 top-8 flex flex-col gap-4">
      {unlocked.map((vital) => (
        <VitalGauge key={vital} indicator={INDICATORS[vital]} world={world} />
      ))}
      {ageUnlocked && <AgeMeter age={world.age} />}
    </div>
  )
}
