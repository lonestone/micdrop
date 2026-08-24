import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Lang } from '../../shared/lang'
import { SurgeField, SurgeKind } from '../../shared/protocol'
import { WorldState } from '../../shared/world'
import { WorldSnapshot, worldStore } from './WorldStore'

/** Discrete state: status, progress, subtitle, camera target, toasts. */
export function useWorldSnapshot(): WorldSnapshot {
  return useSyncExternalStore(worldStore.subscribe, worldStore.getSnapshot)
}

/** The language of the call, read by every component that says a word. */
export function useLang(): Lang {
  return useSyncExternalStore(
    worldStore.subscribe,
    () => worldStore.getSnapshot().lang
  )
}

/**
 * The simulated world, sampled on a timer rather than on every frame.
 *
 * The 3D scene reads worldStore.world() directly inside its render loop and
 * never re-renders React, so this exists only for the few pieces of interface
 * that display a number.
 */
export function useAnimatedWorld(intervalMs = 200): WorldState {
  const [world, setWorld] = useState<WorldState>(() => worldStore.world())
  useEffect(() => {
    const id = setInterval(() => setWorld(worldStore.world()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return world
}

/** Runs the local discovery of gauges and achievements. */
export function useProgressTicker(intervalMs = 400) {
  useEffect(() => {
    const id = setInterval(worldStore.tickProgress, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
}

/** How far a scene event has run, 0 to 1, and undefined when none is playing. */
export function useEventProgress(): number | undefined {
  const { event } = useWorldSnapshot()
  const [progress, setProgress] = useState<number | undefined>()
  const ref = useRef(event)
  ref.current = event

  useEffect(() => {
    if (!event) {
      setProgress(undefined)
      return
    }
    const id = setInterval(() => {
      const current = ref.current
      if (!current) return
      const value =
        (Date.now() - current.startedAt) / 1000 / current.event.duration
      if (value >= 1) {
        setProgress(undefined)
        worldStore.clearEvent()
      } else {
        setProgress(value)
      }
    }, 60)
    return () => clearInterval(id)
  }, [event])

  return progress
}

export interface SurgeView {
  kind: SurgeKind
  /** 0 to 1 over the animation, which for a charge is the time left to speak. */
  progress: number
  fields: SurgeField[]
}

/** The gesture in flight, sampled often enough for a ring to close smoothly. */
export function useSurge(): SurgeView | undefined {
  const { surge } = useWorldSnapshot()
  const [view, setView] = useState<SurgeView | undefined>()
  const ref = useRef(surge)
  ref.current = surge

  useEffect(() => {
    if (!surge) {
      setView(undefined)
      return
    }
    const sample = () => {
      const current = ref.current
      if (!current) return
      const value =
        (Date.now() - current.startedAt) / 1000 / current.surge.duration
      if (value >= 1) {
        setView(undefined)
        worldStore.clearSurge()
      } else {
        setView({
          kind: current.surge.kind,
          progress: value,
          fields: current.surge.fields,
        })
      }
    }
    sample()
    const id = setInterval(sample, 50)
    return () => clearInterval(id)
  }, [surge])

  return view
}
