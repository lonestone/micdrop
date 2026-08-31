import { ReactNode } from 'react'

interface RailHeadingProps {
  title: string
  description: string
  icon: ReactNode
}

/**
 * Where the panels under it act.
 *
 * The rail mixes settings that travel to the server with settings that only
 * ever run in this browser, and which of the two a knob belongs to changes
 * what happens when you move it mid-call. So the rail says it out loud.
 */
export default function RailHeading({
  title,
  description,
  icon,
}: RailHeadingProps) {
  return (
    <div className="flex items-baseline gap-2 px-1 pt-2 first:pt-0">
      <span aria-hidden="true" className="translate-y-0.5 text-faint">
        {icon}
      </span>
      <h2 className="text-sm font-semibold text-main">{title}</h2>
      <p className="min-w-0 flex-1 truncate text-xs text-faint">
        {description}
      </p>
    </div>
  )
}
