import Overlay from './ui/Overlay'
import WorldScene from './world/WorldScene'

/**
 * Scene plus interface, driven entirely by the store.
 *
 * This is the shared surface the whole demo is built around: a live call mounts
 * it next to the Micdrop driver, the test page mounts it next to a panel of
 * buttons, and neither of them can tell the difference.
 */
export default function Experience() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#05050b]">
      <WorldScene />
      <Overlay />
    </div>
  )
}
