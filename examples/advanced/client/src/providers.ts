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
  /** Runs on the machine serving the call rather than behind an API */
  local?: boolean
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
    help: 'The assistant waits instead of answering when the transcript it just read sounds unfinished. Smart Turn does the same from the sound of the voice, without a round trip to the model, so turn it on here only to compare the two.',
  },
  {
    name: 'autoIgnoreUserNoise',
    label: 'Noise filtering',
    help: 'The assistant skips its answer when the transcript carries no real speech, such as a cough, a filler word or a passing noise.',
  },
]

/**
 * The tools the server hands to the agent. Their names match the ones in
 * `server/src/tools.ts`, which is what the server reads to register them.
 */
export type ToolName = 'get_time' | 'get_weather' | 'say_something_later'

export type ToolOptions = Record<ToolName, boolean>

export const TOOL_OPTIONS: { name: ToolName; label: string; help: string }[] = [
  {
    name: 'get_time',
    label: 'Get time',
    help: 'The assistant reads the clock of the server instead of guessing what time it is.',
  },
  {
    name: 'get_weather',
    label: 'Get weather',
    help: 'The assistant looks up the temperature and the wind at a place, which also asks the model for its coordinates.',
  },
  {
    name: 'say_something_later',
    label: 'Say something later',
    help: 'The assistant sets a timer and speaks again once it fires, so it can act as a reminder or an alarm clock.',
  },
]

const DEFAULT_TOOLS: ToolOptions = {
  get_time: true,
  get_weather: true,
  say_something_later: true,
}

const DEFAULT_AUTO: AutoOptions = {
  autoEndCall: true,
  // Smart Turn answers the same question in the browser, for a fraction of the
  // delay and no token at all, so the agent is left out of it by default
  autoSemanticTurn: false,
  // Another tool call on every turn, for a case the transcript rarely gets
  // wrong, so it is left to whoever wants to try it
  autoIgnoreUserNoise: false,
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
  tools: ToolOptions
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
  tools: readStored('tools', DEFAULT_TOOLS),
}

const listeners = new Set<() => void>()

/** Reads one key of the stored settings, falling back to the given default. */
function readStored<T>(key: 'selections' | 'auto' | 'tools', fallback: T): T {
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
      JSON.stringify({
        selections: state.selections,
        auto: state.auto,
        tools: state.tools,
      })
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
  const { catalog, error, selections, auto, tools } = useSyncExternalStore(
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

  const toggleTool = useCallback((name: ToolName, enabled: boolean) => {
    setState({ tools: { ...state.tools, [name]: enabled } })
    persist()
  }, [])

  return {
    catalog,
    error,
    selections,
    select,
    auto,
    toggleAuto,
    tools,
    toggleTool,
  }
}

/** The selection sent to the server when a call starts. */
export function getSelections(): Selections {
  return state.selections
}

/** The automatic prompts sent to the server when a call starts. */
export function getAutoOptions(): AutoOptions {
  return state.auto
}

/** The tools the agent is given, sent to the server when a call starts. */
export function getToolOptions(): ToolOptions {
  return state.tools
}
