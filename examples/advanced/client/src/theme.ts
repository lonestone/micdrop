import { useCallback, useSyncExternalStore } from 'react'

export type Theme = 'dark' | 'light'

/**
 * The theme of the demo, on the rule the site follows: dark unless the visitor
 * asked for light, remembered under the same `theme` key so someone arriving
 * from the docs keeps the mode they were reading in.
 *
 * The value is stamped on `<html>` by the inline script in `index.html`, before
 * React renders, which is what keeps a light reader from seeing a dark flash.
 */
const STORAGE_KEY = 'theme'

const listeners = new Set<() => void>()

function current(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

let theme: Theme = current()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): Theme {
  return theme
}

export function setTheme(next: Theme) {
  theme = next
  document.documentElement.dataset.theme = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // A browser refusing to store just forgets the choice on reload
  }
  listeners.forEach((listener) => listener())
}

export function useTheme() {
  const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const toggle = useCallback(() => {
    setTheme(getSnapshot() === 'light' ? 'dark' : 'light')
  }, [])
  return { theme: value, toggle }
}
