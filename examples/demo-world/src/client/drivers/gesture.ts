import { SURGE_CHARGE, SURGE_RELEASE, SurgeField } from '../../shared/protocol'
import { ShapeWorldInput, surgeFields } from '../../shared/tools'
import { worldStore } from '../store/WorldStore'
import { FakeChange, fakeUpdate } from './fakeServer'

/** Applies one payload against the store, exactly as a tool call would. */
export function send(change: FakeChange) {
  const snapshot = worldStore.getSnapshot()
  worldStore.applyUpdate(
    fakeUpdate(
      { world: worldStore.world(), progress: snapshot.progress },
      change
    )
  )
}

let pending:
  | { fields: SurgeField[]; timer: ReturnType<typeof setTimeout> }
  | undefined

/**
 * A whole gesture, both halves, played against the store the way the server
 * plays it.
 *
 * The test page needs this rather than a single write, because the mechanic the
 * demo is built on is the gap between the two halves: without it the bench
 * would only ever show the polite version of a request.
 */
export function playGesture(
  input: ShapeWorldInput,
  options: { interruptAfter?: number } = {}
): () => void {
  cancelGesture()

  const fields = surgeFields(worldStore.world(), input)
  send({
    shape: input,
    surge: { kind: 'charging', duration: SURGE_CHARGE, fields },
  })

  const interrupted = options.interruptAfter !== undefined
  const delay = interrupted ? options.interruptAfter! : SURGE_CHARGE

  const timer = setTimeout(() => {
    pending = undefined
    if (interrupted) {
      interruptOn(fields)
    } else {
      send({
        overshoot: input,
        countOvershoot: true,
        surge: { kind: 'overshoot', duration: SURGE_RELEASE, fields },
      })
    }
  }, delay * 1000)

  pending = { fields, timer }
  return cancelGesture
}

/** Drops the second half without telling anyone, used when a run is torn down. */
export function cancelGesture() {
  if (!pending) return
  clearTimeout(pending.timer)
  pending = undefined
}

/** What a human talking over her does: the second half never happens. */
export function interruptGesture(): boolean {
  if (!pending) return false
  const { fields } = pending
  cancelGesture()
  interruptOn(fields)
  return true
}

export function hasPendingGesture(): boolean {
  return Boolean(pending)
}

function interruptOn(fields: SurgeField[]) {
  send({
    countInterruption: true,
    surge: { kind: 'stopped', duration: 1.6, fields },
  })
}
