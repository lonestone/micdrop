import { getCollection, type CollectionEntry } from 'astro:content'

/**
 * Builds the docs sidebar from the shape of `src/content/docs`.
 *
 * Every folder becomes a group and every file becomes a link, so moving a file
 * moves its entry in the navigation. Two conventions carry the rest:
 *
 * - `order` in the frontmatter numbers pages across the whole sidebar. A group
 *   inherits the smallest order of the pages it contains, which places it right
 *   where its first page belongs among its siblings.
 * - a folder's `index.mdx` is the page the group links to, and gives it a title.
 *   Folders without one get a title made from their name. The loader drops the
 *   `/index` suffix, so such an entry has the id of the folder itself
 *   (`client/index.mdx` → `client`).
 */

export interface DocsLink {
  type: 'link'
  href: string
  label: string
  order: number
}

export interface DocsGroup {
  type: 'group'
  label: string
  /** Set when the folder holds an `index` page. */
  href?: string
  items: DocsNode[]
  order: number
}

export type DocsNode = DocsLink | DocsGroup

type DocEntry = CollectionEntry<'docs'>

/** `utility-classes` → `Utility Classes` */
function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/** `/docs/client/vad` for the entry id `client/vad`. */
export function docHref(id: string): string {
  return id ? `/docs/${id}` : '/docs'
}

export function docLabel(entry: DocEntry): string {
  return entry.data.sidebarLabel ?? entry.data.title
}

/** Mutable shape used while walking the entries, flattened by `finalize`. */
interface RawGroup {
  label: string
  index?: DocEntry
  children: Map<string, RawGroup>
  pages: DocEntry[]
}

function emptyGroup(label: string): RawGroup {
  return { label, children: new Map(), pages: [] }
}

/**
 * @param folders ids that name a folder rather than a page, so the entry is
 *   that folder's landing page rather than a leaf next to it.
 */
function insert(root: RawGroup, entry: DocEntry, folders: Set<string>) {
  const isFolder = folders.has(entry.id)
  const segments = entry.id.split('/')
  const name = isFolder ? null : segments.pop()!

  let group = root
  for (const segment of segments) {
    if (!group.children.has(segment)) {
      group.children.set(segment, emptyGroup(titleFromSlug(segment)))
    }
    group = group.children.get(segment)!
  }

  if (name === null) group.index = entry
  else group.pages.push(entry)
}

const orderOf = (entry: DocEntry) => entry.data.order ?? Number.MAX_SAFE_INTEGER

function finalize(group: RawGroup): DocsNode[] {
  const nodes: DocsNode[] = group.pages.map((entry) => ({
    type: 'link',
    href: docHref(entry.id),
    label: docLabel(entry),
    order: orderOf(entry),
  }))

  for (const child of group.children.values()) {
    const items = finalize(child)
    if (items.length === 0 && !child.index) continue

    // The group's own page comes first inside it, and sets the group's label.
    const order = Math.min(
      child.index ? orderOf(child.index) : Number.MAX_SAFE_INTEGER,
      ...items.map((item) => item.order)
    )

    nodes.push({
      type: 'group',
      label: child.index ? docLabel(child.index) : child.label,
      href: child.index ? docHref(child.index.id) : undefined,
      items,
      order,
    })
  }

  return nodes.sort(
    (a, b) => a.order - b.order || a.label.localeCompare(b.label)
  )
}

export async function getDocsTree(): Promise<DocsNode[]> {
  const entries = await getCollection('docs')

  // Every path that has something under it is a folder, and the entry sharing
  // its id (if any) is its landing page.
  const folders = new Set<string>()
  for (const entry of entries) {
    const segments = entry.id.split('/')
    for (let depth = 1; depth < segments.length; depth++) {
      folders.add(segments.slice(0, depth).join('/'))
    }
  }

  const root = emptyGroup('Documentation')
  for (const entry of entries) insert(root, entry, folders)
  return finalize(root)
}

/** Flattened reading order, used for the previous / next links under a page. */
export function flattenDocs(nodes: DocsNode[]): DocsLink[] {
  const flat: DocsLink[] = []
  for (const node of nodes) {
    if (node.type === 'link') {
      flat.push(node)
      continue
    }
    if (node.href) {
      flat.push({
        type: 'link',
        href: node.href,
        label: node.label,
        order: node.order,
      })
    }
    flat.push(...flattenDocs(node.items))
  }
  return flat
}

/** True when `href` is the page itself or one of the pages below it. */
export function containsPath(node: DocsNode, path: string): boolean {
  if (node.type === 'link') return node.href === path
  if (node.href === path) return true
  return node.items.some((item) => containsPath(item, path))
}
