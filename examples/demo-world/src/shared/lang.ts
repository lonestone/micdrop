/**
 * Two languages, one demo.
 *
 * The choice is made on the start screen, travels to the server as a call
 * param, and from there decides three things: what she is told to speak in,
 * which pre-written lines the silences and the crowd draw from, and which words
 * the interface uses.
 *
 * Everything localised is a plain table keyed by language rather than a runtime
 * with a loader, because the server reads the very same tables as the browser
 * and a translation layer that only exists in React would leave her voice
 * behind.
 */

export type Lang = 'fr' | 'en'

export const LANGS: Lang[] = ['fr', 'en']

export const DEFAULT_LANG: Lang = 'fr'

/** One value per language, for anything a human reads or hears. */
export type Localized<T> = Record<Lang, T>

/** Turns anything the outside world hands us into a language we speak. */
export function toLang(value?: string | null): Lang {
  const code = (value ?? '').slice(0, 2).toLowerCase()
  return LANGS.includes(code as Lang) ? (code as Lang) : DEFAULT_LANG
}
