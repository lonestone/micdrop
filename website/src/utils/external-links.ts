import type { Element } from 'hast'

// Hostnames that keep a follow link (partners, own projects, trusted sources).
// Add them with and without "www." to cover both forms.
const FOLLOW_LIST = new Set([
  'github.com',
  'lonestone.io',
  'raconte.ai',
  'godefroy.me',
])

export function getExternalLinkRel(element: Element): string[] {
  const href = element.properties?.href
  if (typeof href === 'string') {
    try {
      const { hostname } = new URL(href)
      if (FOLLOW_LIST.has(hostname)) {
        return ['noopener', 'noreferrer']
      }
    } catch {
      // Relative or invalid href: the plugin already filters out non-external links
    }
  }
  return ['nofollow', 'noopener', 'noreferrer']
}
