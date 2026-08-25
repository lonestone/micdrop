import { useCallback, useEffect, useSyncExternalStore } from 'react'

export const SERVER_URL = 'http://localhost:8081'

export type PartName = 'agent' | 'stt' | 'tts'

export interface ModelOption {
  id: string
  label: string
  language?: string
}

export interface ProviderInfo {
  id: string
  label: string
  description?: string
  available: boolean
  missingEnv: string[]
  models: ModelOption[]
  defaultModel?: string
}

export interface PartCatalog {
  providers: ProviderInfo[]
  defaultProvider: string
}

export type Catalog = Record<PartName, PartCatalog>

export interface Selection {
  provider?: string
  model?: string
}

export type Selections = Record<PartName, Selection>

/**
 * The prompts the server adds to every turn. Each one costs the model a tool
 * call, so turning them off is the quickest way to see what a given model
 * handles and what it misses.
 */
export type AutoName =
  | 'autoEndCall'
  | 'autoSemanticTurn'
  | 'autoIgnoreUserNoise'

export type AutoOptions = Record<AutoName, boolean>

export const AUTO_OPTIONS: { name: AutoName; label: string; help: string }[] = [
  {
    name: 'autoEndCall',
    label: 'Auto end call',
    help: 'The assistant hangs up on its own once the user asks to end the call, instead of waiting to be disconnected.',
  },
  {
    name: 'autoSemanticTurn',
    label: 'Semantic turn detection',
    help: 'The assistant waits instead of answering when the sentence it just heard sounds unfinished, so a pause in the middle of a thought no longer cuts the user off.',
  },
  {
    name: 'autoIgnoreUserNoise',
    label: 'Noise filtering',
    help: 'The assistant skips its answer when the transcript carries no real speech, such as a cough, a filler word or a passing noise.',
  },
]

const DEFAULT_AUTO: AutoOptions = {
  autoEndCall: true,
  autoSemanticTurn: true,
  autoIgnoreUserNoise: true,
}

export const PART_LABELS: Record<PartName, string> = {
  agent: 'Agent',
  stt: 'Speech to text',
  tts: 'Text to speech',
}

const STORAGE_KEY = 'micdrop-demo-providers'

interface State {
  catalog?: Catalog
  error?: string
  selections: Selections
  auto: AutoOptions
}

/**
 * The providers picked in the header, shared between the selects that write
 * them and the call button that sends them.
 *
 * A plain store rather than a context: the demo has two consumers in different
 * branches of the tree, and the selection has to survive a reload so that
 * trying a provider does not mean picking it again on every refresh.
 */
let state: State = {
  selections: readStored('selections', { agent: {}, stt: {}, tts: {} }),
  auto: readStored('auto', DEFAULT_AUTO),
}

const listeners = new Set<() => void>()

/** Reads one key of the stored settings, falling back to the given default. */
function readStored<T>(key: 'selections' | 'auto', fallback: T): T {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return fallback
    const parsed = JSON.parse(stored)
    // The stored shape used to be the selections alone, without the wrapper
    const value =
      key === 'selections' && !parsed.selections ? parsed : parsed[key]
    return value ? { ...fallback, ...value } : fallback
  } catch {
    return fallback
  }
}

function persist() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ selections: state.selections, auto: state.auto })
    )
  } catch {
    // A browser refusing to store just forgets the settings on reload
  }
}

function setState(next: Partial<State>) {
  state = { ...state, ...next }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return state
}

let loading: Promise<void> | undefined

/** Reads the catalog once, and fills the selection with its defaults. */
function loadCatalog() {
  if (loading) return loading
  loading = fetch(`${SERVER_URL}/providers`)
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response.json() as Promise<Catalog>
    })
    .then((catalog) => {
      const selections = { ...state.selections }
      for (const part of Object.keys(catalog) as PartName[]) {
        selections[part] = completeSelection(catalog, part, selections[part])
      }
      setState({ catalog, selections, error: undefined })
    })
    .catch((error: Error) => {
      loading = undefined
      setState({ error: `Cannot read providers: ${error.message}` })
    })
  return loading
}

/**
 * Fills in what a selection leaves out, and drops what the server no longer
 * offers, so a provider removed from the catalog does not stay stuck in the
 * browser storage of whoever picked it.
 */
function completeSelection(
  catalog: Catalog,
  part: PartName,
  selection: Selection
): Selection {
  const { providers, defaultProvider } = catalog[part]
  const picked = providers.find(
    (provider) => provider.id === selection.provider && provider.available
  )
  const provider =
    picked ?? providers.find((item) => item.id === defaultProvider)
  if (!provider) return {}

  const model =
    provider.models.find((option) => option.id === selection.model) ??
    provider.models.find((option) => option.id === provider.defaultModel) ??
    provider.models[0]

  return { provider: provider.id, model: model?.id }
}

export function useProviders() {
  const { catalog, error, selections, auto } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot
  )

  useEffect(() => {
    loadCatalog()
  }, [])

  const select = useCallback((part: PartName, selection: Selection) => {
    const next = { ...state.selections, [part]: selection }
    setState({
      selections: state.catalog
        ? { ...next, [part]: completeSelection(state.catalog, part, selection) }
        : next,
    })
    persist()
  }, [])

  const toggleAuto = useCallback((name: AutoName, enabled: boolean) => {
    setState({ auto: { ...state.auto, [name]: enabled } })
    persist()
  }, [])

  return { catalog, error, selections, select, auto, toggleAuto }
}

/** The selection sent to the server when a call starts. */
export function getSelections(): Selections {
  return state.selections
}

/** The automatic prompts sent to the server when a call starts. */
export function getAutoOptions(): AutoOptions {
  return state.auto
}
