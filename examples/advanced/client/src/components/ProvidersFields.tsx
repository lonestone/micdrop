import { useMicdropState } from '@micdrop/react'
import {
  LANGUAGE_OPTIONS,
  PART_LABELS,
  PARTS,
  ProviderInfo,
  Selection,
  useProviders,
} from '../providers'
import Field from './ui/Field'
import Select from './ui/Select'

/**
 * What runs the call: the language it is held in, and one provider per part.
 *
 * The catalog comes from the server, so a provider whose API key is missing,
 * or whose local model is not installed, appears greyed out rather than
 * failing once the call has started.
 */
export default function ProvidersFields() {
  const { isStarted } = useMicdropState()
  const { catalog, error, lang, selectLang, selections, select } =
    useProviders()

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs leading-relaxed text-danger">
          {error}
        </p>
      )}
      {!error && !catalog && (
        <p className="text-xs text-faint">
          Reading the catalog from the server…
        </p>
      )}

      <Field label="Language">
        <Select
          className="w-full"
          value={lang}
          disabled={isStarted}
          aria-label="Language"
          onChange={(event) => selectLang(event.target.value)}
        >
          {LANGUAGE_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>

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

/** One part of the call, and the model the chosen provider runs it with */
function PartRow({
  label,
  providers,
  selection,
  disabled,
  onChange,
}: PartRowProps) {
  const provider = providers.find((item) => item.id === selection.provider)
  const hasModels = provider && provider.models.length > 0

  const handleProvider = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ provider: event.target.value })
  }

  const handleModel = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ provider: selection.provider, model: event.target.value })
  }

  return (
    <Field label={label}>
      <Select
        className="w-full"
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
            {item.local ? ' (local)' : ''}
            {item.available ? '' : ' (unavailable)'}
          </option>
        ))}
      </Select>

      {hasModels && (
        <Select
          className="w-full"
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
        </Select>
      )}
    </Field>
  )
}
