import { useMicdropState } from '@micdrop/react'
import { AUTO_OPTIONS, useProviders } from '../providers'

/**
 * The prompts the agent runs on every turn, ticked for the next call.
 *
 * They live here rather than in the server code because their reliability is
 * what changes most between a hosted model and a small local one, and turning
 * them off one at a time is how you find which one a model mishandles.
 */
export default function AgentOptions() {
  const { isStarted } = useMicdropState()
  const { auto, toggleAuto } = useProviders()

  return (
    <div className="flex items-start gap-3">
      <span className="w-32 shrink-0 pt-0.5 text-sm text-gray-600">
        Agent prompts
      </span>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {AUTO_OPTIONS.map(({ name, label, help }) => (
          <label
            key={name}
            className={`flex cursor-help items-center gap-2 text-sm ${
              isStarted ? 'text-gray-400' : 'text-gray-700'
            }`}
            title={help}
          >
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-200 disabled:opacity-50"
              checked={auto[name]}
              disabled={isStarted}
              onChange={(event) => toggleAuto(name, event.target.checked)}
            />
            {label}
            <span
              aria-hidden="true"
              className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600"
            >
              ?
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
