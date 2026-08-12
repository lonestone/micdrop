import { getCollection, getEntry, type CollectionEntry } from 'astro:content'

export type Post = CollectionEntry<'blog'>

/** `alternative-to-pipecat/index` → `alternative-to-pipecat` */
export function postSlug(id: string): string {
  return id.replace(/\/index$/, '')
}

export function postHref(id: string): string {
  return `/blog/${postSlug(id)}`
}

/** Published posts, newest first. */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', (post) => !post.data.draft)
  return posts.sort(
    (a, b) => (b.data.date?.getTime() ?? 0) - (a.data.date?.getTime() ?? 0)
  )
}

export interface Author {
  key: string
  name: string
  url?: string
  imageUrl?: string
  title?: string
}

export async function getAuthor(key?: string): Promise<Author | undefined> {
  if (!key) return undefined
  const entry = await getEntry('authors', key)
  return entry ? { key, ...entry.data } : undefined
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/** Reading time in minutes, at the 200 words per minute the old site assumed. */
export function readingTime(body: string): number {
  const words = body.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}
