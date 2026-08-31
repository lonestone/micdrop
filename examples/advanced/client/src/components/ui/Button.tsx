import React from 'react'

type Variant = 'primary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  /** Sits before the label, and is the whole button when there is no label */
  icon?: React.ReactNode
}

const VARIANTS: Record<Variant, string> = {
  // Emerald fill with the dark ink the site pairs it with
  primary:
    'bg-accent text-on-accent hover:brightness-110 active:brightness-95 ' +
    'disabled:bg-line-strong disabled:text-faint',
  ghost:
    'border border-line bg-raised text-main hover:border-line-strong ' +
    'disabled:text-faint',
  danger:
    'border border-danger bg-danger-soft text-danger hover:brightness-110 ' +
    'disabled:border-line disabled:text-faint disabled:bg-transparent',
}

const SIZES: Record<Size, string> = {
  sm: 'h-8 gap-1.5 px-3 text-xs',
  md: 'h-10 gap-2 px-4 text-sm',
}

/**
 * Every button of the demo, in the three jobs it has: start the thing, do
 * something next to it, or stop the call.
 */
export default function Button({
  variant = 'ghost',
  size = 'md',
  icon,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex shrink-0 items-center justify-center rounded-lg
        font-medium transition-[filter,border-color,color] duration-150 ease-rise
        active:translate-y-px disabled:cursor-not-allowed disabled:active:translate-y-0
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}
