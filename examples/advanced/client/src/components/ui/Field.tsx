import { ReactNode } from 'react'

interface FieldProps {
  label: string
  /** Points the label at the control it names */
  htmlFor?: string
  children: ReactNode
}

/**
 * One labelled setting. The label holds its own column so a stack of them
 * reads down the left edge, and folds above the control on a narrow screen.
 */
export default function Field({ label, htmlFor, children }: FieldProps) {
  return (
    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-start sm:gap-x-3">
      <label htmlFor={htmlFor} className="text-sm text-dim sm:py-2">
        {label}
      </label>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {children}
      </div>
    </div>
  )
}
