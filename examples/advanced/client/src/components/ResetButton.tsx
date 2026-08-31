interface ResetButtonProps {
  onClick: () => void
  /** Greyed out while the settings of the card cannot be touched */
  disabled?: boolean
}

/** Puts one card back to the settings it started with */
export default function ResetButton({ onClick, disabled }: ResetButtonProps) {
  return (
    <div className="flex justify-end">
      <button
        onClick={onClick}
        disabled={disabled}
        className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded border border-gray-300 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:hover:bg-gray-100"
      >
        Reset to default
      </button>
    </div>
  )
}
