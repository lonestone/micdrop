import { Indicator, indicatorStrain } from '../../shared/indicators'
import { WorldState } from '../../shared/world'
import { useLang } from '../store/hooks'

interface VitalGaugeProps {
  indicator: Indicator
  world: WorldState
}

/**
 * A band, not a maximum. Full is wrong, right is right, and the shape says so
 * without a word of explanation.
 *
 * It never carries anything her voice has not already said: it exists so
 * progress can be felt at a glance, never so it has to be read.
 */
export default function VitalGauge({ indicator, world }: VitalGaugeProps) {
  const lang = useLang()
  const value = world[indicator.vital]
  const [min, max] = indicator.band
  const strain = indicatorStrain(world, indicator.vital)
  const comfortable = strain === 0

  return (
    <div className="animate-rise w-40">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-[0.18em] text-[#7d7a92]">
          {indicator.label[lang]}
        </span>
      </div>
      <div className="relative h-[3px] w-full rounded-full bg-white/10">
        <div
          className="absolute inset-y-0 rounded-full bg-white/20"
          style={{ left: `${min * 100}%`, width: `${(max - min) * 100}%` }}
        />
        <div
          className={[
            'absolute top-1/2 h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-[left] duration-500 ease-out',
            comfortable ? 'bg-[#cfe3ff]' : 'animate-strain bg-[#ff9d7a]',
          ].join(' ')}
          style={{ left: `${Math.min(100, Math.max(0, value * 100))}%` }}
        />
      </div>
    </div>
  )
}
