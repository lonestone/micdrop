import { useMicdropState } from '@micdrop/react'
import {
  PART_LABELS,
  PartName,
  ProviderInfo,
  Selection,
  useProviders,
} from '../providers'
import AgentOptions from './AgentOptions'

const PARTS: PartName[] = ['agent', 'stt', 'tts']

const SELECT_CLASS =
  'form-select min-w-0 rounded-md border-gray-300 shadow-sm focus:border-blue-300 ' +
  'focus:ring focus:ring-blue-200 focus:ring-opacity-50 py-1 text-sm disabled:bg-gray-100'

/**
 * The three lines at the top of the demo, one per part of a call.
 *
 * The catalog comes from the server, so a provider whose API key is missing,
 * or whose local model is not installed, appears greyed out rather than
 * failing once the call has started.
 */
export default function ProvidersSettings() {
  const { isStarted } = useMicdropState()
  const { catalog, error, selections, select } = useProviders()

  // The agent prompts are independent of the catalog, so a server that cannot
  // be read loses the provider rows and keeps the checkboxes.
  return (
    <div className="flex flex-col gap-2">
      {error && <div className="text-sm text-red-500">{error}</div>}
      {!error && !catalog && (
        <div className="text-sm text-gray-500">Loading providers…</div>
      )}
      {catalog &&
        PARTS.map((part) => (
          <PartRow
            key={part}
            label={PART_LABELS[part]}
            providers={catalog[part].providers}
            selection={selections[part]}
            disabled={isStarted}
            onChange={(selection) => select(part, selection)}
          />
        ))}
      <AgentOptions />
      {isStarted && (
        <p className="text-xs text-gray-500">
          Stop the call to change these settings.
        </p>
      )}
    </div>
  )
}

interface PartRowProps {
  label: string
  providers: ProviderInfo[]
  selection: Selection
  disabled: boolean
  onChange: (selection: Selection) => void
}

function PartRow({
  label,
  providers,
  selection,
  disabled,
  onChange,
}: PartRowProps) {
  const provider = providers.find((item) => item.id === selection.provider)

  const handleProvider = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ provider: event.target.value })
  }

  const handleModel = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ provider: selection.provider, model: event.target.value })
  }

  return (
    <div className="flex items-center gap-3">
      <label className="w-32 shrink-0 text-sm text-gray-600">{label}</label>
      <select
        className={`${SELECT_CLASS} w-44 shrink-0`}
        value={selection.provider ?? ''}
        disabled={disabled}
        aria-label={label}
        onChange={handleProvider}
      >
        {providers.map((item) => (
          <option
            key={item.id}
            value={item.id}
            disabled={!item.available}
            title={
              item.available
                ? item.description
                : `Missing ${item.missingEnv.join(', ') || 'setup'}`
            }
          >
            {item.label}
            {item.available ? '' : ' (unavailable)'}
          </option>
        ))}
      </select>

      {provider && provider.models.length > 0 && (
        <select
          className={`${SELECT_CLASS} flex-1 max-w-64`}
          value={selection.model ?? ''}
          disabled={disabled}
          aria-label={`${label} model`}
          onChange={handleModel}
        >
          {provider.models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.label}
              {model.language ? ` (${model.language})` : ''}
            </option>
          ))}
        </select>
      )}

      {provider?.description && (
        <span className="hidden lg:block truncate text-xs text-gray-500">
          {provider.description}
        </span>
      )}
    </div>
  )
}
