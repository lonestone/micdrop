import { PiMoonBold, PiSunBold } from 'react-icons/pi'
import { useTheme } from '../theme'

/**
 * Switches the demo between the two modes of the site, and remembers the
 * choice under the same key, so arriving from the docs in light mode lands
 * here in light mode.
 */
export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-dim
        transition-colors duration-150 ease-rise hover:bg-raised hover:text-main"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggle}
    >
      {isDark ? (
        <PiSunBold aria-hidden="true" className="h-4 w-4" />
      ) : (
        <PiMoonBold aria-hidden="true" className="h-4 w-4" />
      )}
    </button>
  )
}
