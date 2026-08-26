import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * `lastmod` for a sitemap entry: the date of the last commit that touched the page's
 * own source file.
 *
 * Stamping every URL with the build date would tell a crawler the whole site changed
 * on every deploy, which is exactly the signal `lastmod` exists to carry. Git holds
 * the real answer, and the content layout makes it derivable from the URL:
 * `content/<collection>/<slug>/index.mdx`.
 *
 * The build date is the fallback, for a page with no content file behind it (an
 * `.astro` route) and for a checkout with no git history.
 */

const websiteRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const contentRoot = resolve(websiteRoot, 'src', 'content')

const buildDate = new Date().toISOString()

const EXTENSIONS = ['mdx', 'md']
const DATE_LINE = /^\d{4}-\d{2}-\d{2}T/

/** The files a `<collection>/<slug>` entry can live in, most specific first. */
function entryFiles(collection: string, slug: string): string[] {
  const base = resolve(contentRoot, collection, slug)
  return [
    ...EXTENSIONS.map((extension) => resolve(base, `index.${extension}`)),
    ...EXTENSIONS.map((extension) => `${base}.${extension}`),
  ]
}

/** The content file behind a site path, when one exists. */
function sourceFile(pathname: string): string | undefined {
  // A slug with accents reaches the sitemap percent-encoded.
  const segments = decodeURIComponent(pathname)
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(Boolean)
  const [first, ...rest] = segments

  return [
    // A collection with its own URL prefix: blog, docs…
    ...(first ? entryFiles(first, rest.join('/') || 'index') : []),
    // Anything else is a standalone page.
    ...entryFiles('pages', segments.join('/') || 'index'),
  ].find((file) => existsSync(file))
}

/**
 * Date of the last commit on every content file, read in one `git log`. A `git log`
 * per page instead costs seconds of build time once a site has a few hundred of them.
 */
let history: Map<string, string> | undefined

function commitDates(): Map<string, string> {
  if (history) return history

  history = new Map()
  try {
    const log = execFileSync(
      'git',
      // `core.quotepath` off: git escapes a non-ASCII path otherwise, and the
      // accented slugs would never match.
      [
        '-c',
        'core.quotepath=false',
        'log',
        '--format=%cI',
        '--name-only',
        '--relative',
        '--',
        'src/content',
      ],
      {
        cwd: websiteRoot,
        encoding: 'utf-8',
        maxBuffer: 64 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'ignore'],
      }
    ).split('\n')

    let date = buildDate
    for (const line of log) {
      if (!line) continue
      if (DATE_LINE.test(line)) date = line
      // Commits come newest first, so a file's first mention is its last change.
      else if (!history.has(line)) history.set(line, date)
    }
  } catch {
    // No git history in this checkout: the build date is the best we know.
  }

  return history
}

export function contentLastmod(pathname: string): string {
  const file = sourceFile(pathname)
  if (!file) return buildDate
  return commitDates().get(relative(websiteRoot, file)) ?? buildDate
}
