import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Whether the visitor asked their system to stop animating things.
 *
 * The stylesheet already cuts every CSS animation short. This is for the
 * movement React drives itself, the orb that follows the voice, which has to
 * be told rather than overridden.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (listener) => {
      const media = window.matchMedia(QUERY)
      media.addEventListener('change', listener)
      return () => media.removeEventListener('change', listener)
    },
    () => window.matchMedia(QUERY).matches,
    () => false
  )
}
