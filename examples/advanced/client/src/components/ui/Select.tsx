import React from 'react'
import { PiCaretDownBold } from 'react-icons/pi'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

/** A native select, wearing the surfaces of the demo rather than the browser's */
export default function Select({ className = '', ...props }: SelectProps) {
  return (
    <div className={`relative min-w-0 ${className}`}>
      <select
        className="w-full appearance-none truncate rounded-lg border border-line bg-raised
          py-2 pl-3 pr-9 text-sm text-main transition-colors duration-150 ease-rise
          hover:border-line-strong disabled:cursor-not-allowed disabled:text-faint"
        {...props}
      />
      <PiCaretDownBold
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-faint"
      />
    </div>
  )
}
