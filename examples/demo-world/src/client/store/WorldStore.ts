import { INITIAL_PROGRESS, Progress } from '../../shared/indicators'
import { DEFAULT_LANG, Lang } from '../../shared/lang'
import { advanceProgress, mergeProgress } from '../../shared/progress'
import { CameraTarget, SceneEvent, Surge, WorldUpdate } from '../../shared/protocol'
import { createSimulator } from '../../shared/simulate'
import { INITIAL_WORLD, Vital, WorldState } from '../../shared/world'

export type Status = 'offline' | 'listening' | 'thinking' | 'speaking'

export interface Subtitle {
  text: string
  /** Three voices, one throat: hers, the user's, and the one she relays. */
  from: 'planet' | 'user' | 'people'
}

export interface Toast {
  id: number
  kind: 'achievement' | 'indicator' | 'commandment'
  key: string
}

export interface WorldSnapshot {
  /** Chosen on the start screen, and the language of everything after it. */
  lang: Lang
  /** Last state received from the server, the browser simulates from here. */
  base: WorldState
  baseAt: number
  progress: Progress
  status: Status
  subtitle?: Subtitle
  event?: { event: SceneEvent; startedAt: number }
  /** The gesture in flight, which is the one thing worth interrupting. */
  surge?: { surge: Surge; startedAt: number }
  look: CameraTarget
  toasts: Toast[]
  simSpeed: number
  paused: boolean
}

const INITIAL_SNAPSHOT: WorldSnapshot = {
  lang: DEFAULT_LANG,
  base: INITIAL_WORLD,
  baseAt: Date.now(),
  progress: INITIAL_PROGRESS,
  status: 'offline',
  look: 'whole',
  toasts: [],
  simSpeed: 1,
  paused: false,
}

/**
 * The single thing every component reads from.
 *
 * Nothing in the interface knows where its data comes from, which is what lets
 * a live call and the test page drive exactly the same scene. Drivers write,
 * components read.
 *
 * Discrete values live in the snapshot, while the world itself is computed on
 * demand from a base state and elapsed time, so the planet keeps evolving
 * between two messages without any of it going through React.
 */
export class WorldStore {
  private snapshot: WorldSnapshot = INITIAL_SNAPSHOT
  private listeners = new Set<() => void>()
  private simulator = createSimulator()
  private toastId = 0
  private lastProgressWorld: WorldState = INITIAL_WORLD
  private frozenElapsed = 0

  // ------------------------------------------------------------ subscription

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot = (): WorldSnapshot => this.snapshot

  private set(patch: Partial<WorldSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch }
    this.listeners.forEach((listener) => listener())
  }

  // ------------------------------------------------------------------- world

  /** Seconds of simulation elapsed since the base state, honouring pause. */
  private elapsed(now: number): number {
    const { baseAt, simSpeed, paused } = this.snapshot
    if (paused) return this.frozenElapsed
    return ((now - baseAt) / 1000) * simSpeed
  }

  /** The world as it stands right now. Safe to call every frame. */
  world = (now = Date.now()): WorldState =>
    this.simulator(this.snapshot.base, this.elapsed(now))

  private rebase(world: WorldState, extra: Partial<WorldSnapshot> = {}) {
    this.simulator = createSimulator()
    this.frozenElapsed = 0
    this.set({ base: world, baseAt: Date.now(), ...extra })
  }

  // ------------------------------------------------------------------ writes

  /** The one entry point for anything coming from the server. */
  applyUpdate = (update: WorldUpdate) => {
    const progress = mergeProgress(this.snapshot.progress, update.progress)
    const carved = progress.commandments.filter(
      (text) => !this.snapshot.progress.commandments.includes(text)
    )
    const toasts = [
      ...this.snapshot.toasts,
      ...update.unlocked.map((vital) => this.makeToast('indicator', vital)),
      ...update.achievements.map((id) => this.makeToast('achievement', id)),
      ...carved.map((text) => this.makeToast('commandment', text)),
    ]
    this.lastProgressWorld = update.world
    this.rebase(update.world, {
      progress,
      toasts,
      look: update.look ?? this.snapshot.look,
      event: update.event
        ? { event: update.event, startedAt: Date.now() }
        : this.snapshot.event,
      // A gesture that resolves clears itself: charging is the only kind that
      // has to survive until something answers it.
      surge: update.surge
        ? { surge: update.surge, startedAt: Date.now() }
        : this.snapshot.surge,
      subtitle: update.chorus
        ? { text: update.chorus, from: 'people' }
        : this.snapshot.subtitle,
    })
  }

  /** Direct manipulation, used by the test page. */
  setWorld = (patch: Partial<WorldState>) => {
    this.rebase({ ...this.world(), ...patch })
  }

  setProgress = (patch: Partial<Progress>) => {
    this.set({ progress: { ...this.snapshot.progress, ...patch } })
  }

  setLang = (lang: Lang) => this.set({ lang })

  setStatus = (status: Status) => this.set({ status })

  setSubtitle = (subtitle?: Subtitle) => this.set({ subtitle })

  setLook = (look: CameraTarget) => this.set({ look })

  playEvent = (event: SceneEvent) =>
    this.set({ event: { event, startedAt: Date.now() } })

  clearEvent = () => this.set({ event: undefined })

  playSurge = (surge: Surge) =>
    this.set({ surge: { surge, startedAt: Date.now() } })

  clearSurge = () => this.set({ surge: undefined })

  setSimSpeed = (simSpeed: number) => {
    const world = this.world()
    this.rebase(world, { simSpeed })
  }

  setPaused = (paused: boolean) => {
    if (paused) {
      this.frozenElapsed = this.elapsed(Date.now())
      this.set({ paused })
    } else {
      const world = this.world()
      this.set({ paused })
      this.rebase(world)
    }
  }

  dismissToast = (id: number) =>
    this.set({ toasts: this.snapshot.toasts.filter((t) => t.id !== id) })

  reset = () => {
    this.simulator = createSimulator()
    this.toastId = 0
    this.lastProgressWorld = INITIAL_WORLD
    this.frozenElapsed = 0
    this.snapshot = {
      ...INITIAL_SNAPSHOT,
      lang: this.snapshot.lang,
      baseAt: Date.now(),
    }
    this.listeners.forEach((listener) => listener())
  }

  // --------------------------------------------------------------- discovery

  /**
   * Gauges and achievements are derived here rather than sent, because the
   * browser runs the very same deterministic simulation as the server and would
   * otherwise have to wait for a message to notice that something grew.
   */
  tickProgress = () => {
    const world = this.world()
    const result = advanceProgress({
      previousWorld: this.lastProgressWorld,
      world,
      progress: this.snapshot.progress,
      crisisSurvived: this.snapshot.progress.achievements.includes('stayed'),
    })
    this.lastProgressWorld = world
    if (!result.changed) return
    this.set({
      progress: result.progress,
      toasts: [
        ...this.snapshot.toasts,
        ...result.unlocked.map((vital) => this.makeToast('indicator', vital)),
        ...result.achievements.map((id) => this.makeToast('achievement', id)),
      ],
    })
  }

  private makeToast(kind: Toast['kind'], key: string | Vital): Toast {
    return { id: ++this.toastId, kind, key }
  }
}

export const worldStore = new WorldStore()
