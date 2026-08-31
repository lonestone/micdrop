import { PiMicrophoneBold } from 'react-icons/pi'
import ThemeToggle from './ThemeToggle'

/** The one line above the workspace: what this is, and which mode to read it in */
export default function TopBar() {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-line bg-panel px-4">
      <span
        aria-hidden="true"
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent-ink"
      >
        <PiMicrophoneBold className="h-4 w-4" />
      </span>
      <h1 className="flex min-w-0 items-baseline gap-2 truncate">
        <span className="text-sm font-semibold text-main">Micdrop</span>
        <span className="truncate text-sm text-faint">advanced demo</span>
      </h1>
      <div className="flex-1" />
      <ThemeToggle />
    </header>
  )
}
