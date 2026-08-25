import { useMicdropState } from '@micdrop/react'
import { AUTO_OPTIONS, TOOL_OPTIONS, useProviders } from '../providers'

/**
 * The prompts the agent runs on every turn and the tools it is given, ticked
 * for the next call.
 *
 * They live here rather than in the server code because their reliability is
 * what changes most between a hosted model and a small local one, and turning
 * them off one at a time is how you find which one a model mishandles.
 */
export default function AgentOptions() {
  const { isStarted } = useMicdropState()
  const { auto, toggleAuto, tools, toggleTool } = useProviders()

  return (
    <>
      <CheckboxRow
        label="Agent prompts"
        options={AUTO_OPTIONS}
        checked={auto}
        disabled={isStarted}
        onToggle={toggleAuto}
      />
      <CheckboxRow
        label="Agent tools"
        options={TOOL_OPTIONS}
        checked={tools}
        disabled={isStarted}
        onToggle={toggleTool}
      />
    </>
  )
}

interface CheckboxRowProps<Name extends string> {
  label: string
  options: { name: Name; label: string; help: string }[]
  checked: Record<Name, boolean>
  disabled: boolean
  onToggle: (name: Name, enabled: boolean) => void
}

/** One labelled line of checkboxes, each explaining itself on hover. */
function CheckboxRow<Name extends string>({
  label,
  options,
  checked,
  disabled,
  onToggle,
}: CheckboxRowProps<Name>) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-32 shrink-0 pt-0.5 text-sm text-gray-600">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {options.map((option) => (
          <label
            key={option.name}
            className={`flex cursor-help items-center gap-2 text-sm ${
              disabled ? 'text-gray-400' : 'text-gray-700'
            }`}
            title={option.help}
          >
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-200 disabled:opacity-50"
              checked={checked[option.name]}
              disabled={disabled}
              onChange={(event) => onToggle(option.name, event.target.checked)}
            />
            {option.label}
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
