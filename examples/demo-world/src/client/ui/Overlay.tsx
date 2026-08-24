import {
  useAnimatedWorld,
  useEventProgress,
  useWorldSnapshot,
} from '../store/hooks'
import Commandments from './Commandments'
import EventFlash from './EventFlash'
import GestureBanner from './GestureBanner'
import PlanetName from './PlanetName'
import Subtitle from './Subtitle'
import Toasts from './Toasts'
import Vitals from './Vitals'

/**
 * Everything drawn on top of her, and nothing that knows where its data comes
 * from. The live call and the test page mount the very same overlay.
 *
 * Nothing here reports the state of the call. Listening and thinking are
 * silences and are shown as silence; the one status with a look of its own is
 * her speaking, and that lives in the scene (see world/Voice).
 */
export default function Overlay() {
  const { progress, subtitle, event, toasts } = useWorldSnapshot()
  const world = useAnimatedWorld()
  const eventProgress = useEventProgress()

  const met = progress.overshoots + progress.interruptions

  return (
    <div className="pointer-events-none absolute inset-0">
      <EventFlash id={event?.event.id} progress={eventProgress} />
      <Vitals
        unlocked={progress.indicators}
        ageUnlocked={progress.ageUnlocked}
        world={world}
      />
      <Commandments commandments={progress.commandments} />
      <GestureBanner firstTime={met === 0} />
      <Toasts toasts={toasts} />
      <PlanetName name={progress.planetName} world={world} />
      <Subtitle subtitle={subtitle} />
    </div>
  )
}
