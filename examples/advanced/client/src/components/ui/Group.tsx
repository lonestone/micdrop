import { ReactNode } from 'react'

interface GroupProps {
  title: string
  description?: string
  /** Draws the rule that separates this subject from the one above it */
  className?: string
  children: ReactNode
}

/**
 * One subject inside a panel.
 *
 * Everything the client sends to the server belongs in one panel, which is
 * three separate subjects: what runs the call, how the agent behaves, and
 * where the turns are weighed. Groups keep them apart without turning one
 * panel into three.
 */
export default function Group({
  title,
  description,
  className = '',
  children,
}: GroupProps) {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex flex-col gap-0.5">
        <h3 className="text-xs font-semibold text-dim">{title}</h3>
        {description && (
          <p className="text-xs leading-relaxed text-faint">{description}</p>
        )}
      </div>
      {children}
    </div>
  )
}
