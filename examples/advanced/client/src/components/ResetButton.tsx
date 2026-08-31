import { PiArrowCounterClockwiseBold } from 'react-icons/pi'
import Button from './ui/Button'

interface ResetButtonProps {
  onClick: () => void
  /** Greyed out while the settings of the card cannot be touched */
  disabled?: boolean
  children?: string
}

/** Puts one card back to the settings it started with */
export default function ResetButton({
  onClick,
  disabled,
  children = 'Reset to defaults',
}: ResetButtonProps) {
  return (
    <div className="flex justify-end">
      <Button
        size="sm"
        disabled={disabled}
        icon={
          <PiArrowCounterClockwiseBold aria-hidden="true" className="h-3 w-3" />
        }
        onClick={onClick}
      >
        {children}
      </Button>
    </div>
  )
}
