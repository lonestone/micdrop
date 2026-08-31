import { useState } from 'react'
import { FaChevronDown } from 'react-icons/fa'

interface DetectorCardProps {
  name: string
  description: string
  enabled: boolean
  onToggle: (enabled: boolean) => void
  /** Switching this one off would leave the microphone deaf */
  lockedOn?: boolean
  /** Something else is doing this job, so it cannot be switched on */
  lockedOff?: boolean
  note?: string
  status?: React.ReactNode
  children: React.ReactNode
}

/**
 * One detector, switchable from its header and tunable once unfolded.
 *
 * The header carries what is worth seeing without opening anything: whether
 * the detector is on, what it is doing right now, and what it just answered.
 */
export default function DetectorCard({
  name,
  description,
  enabled,
  onToggle,
  lockedOn,
  lockedOff,
  note,
  status,
  children,
}: DetectorCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div
      className={`border border-gray-200 shadow-sm rounded-lg ${
        enabled ? '' : 'opacity-60'
      }`}
    >
      <div
        className="flex items-center gap-2 p-4 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-200 disabled:opacity-50"
          checked={enabled}
          disabled={lockedOn || lockedOff}
          title={
            lockedOn
              ? 'Keep at least one voice detector on'
              : lockedOff
                ? 'The server is doing this job'
                : `Turn ${name} ${enabled ? 'off' : 'on'}`
          }
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => onToggle(event.target.checked)}
        />
        <div className="flex-1">
          <strong>{name}</strong>
          <span className="ml-3 text-sm text-gray-600">{description}</span>
          {note && <span className="ml-3 text-sm text-blue-500">{note}</span>}
        </div>
        {status}
        <FaChevronDown className={`w-4 h-4 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && <div className="flex flex-col gap-4 p-4 pt-2">{children}</div>}
    </div>
  )
}
