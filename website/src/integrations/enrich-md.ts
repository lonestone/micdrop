import type { AstroIntegration } from 'astro'
import { readFileSync, writeFileSync } from 'fs'
import { join, relative } from 'path'
import { fileURLToPath } from 'url'
import { globSync } from 'glob'
import TurndownService from 'turndown'

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
})
// Cast: turndown's types restrict tag names to `keyof HTMLElementTagNameMap`,
// but we also want to strip 'svg', a valid SVG element.
turndown.remove([
  'svg' as any,
  'video',
  'picture',
  'script',
  'style',
  'noscript',
  'iframe',
])

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

/**
 * Astro integration that generates a `.md` twin for every rendered HTML
 * page. Title and description come from <head>, body from <main>.
 *
 * Why: LLM crawlers and "view as markdown" clients can fetch the `.md`
 * URL directly. A Netlify `_headers` file is also written with a
 * RFC 8288 Link header pointing each HTML page to its markdown alternate.
 */
export default function enrichMd(): AstroIntegration {
  let siteUrl = ''
  return {
    name: 'enrich-md',
    hooks: {
      'astro:config:done': ({ config }) => {
        siteUrl = config.site?.replace(/\/$/, '') || ''
      },
      'astro:build:done': ({ dir }) => {
        const distDir = fileURLToPath(dir)
        const htmlFiles = globSync('**/*.html', { cwd: distDir })

        let generated = 0
        const mdPages: Array<{ urlPath: string; mdUrlPath: string }> = []

        for (const htmlFile of htmlFiles) {
          const htmlPath = join(distDir, htmlFile)
          const html = readFileSync(htmlPath, 'utf-8')

          // Skip redirect pages (they have no <main>).
          const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/)
          if (!mainMatch) continue

          const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/)
          const descMatch = html.match(
            /<meta\s+name="description"\s+content="([^"]*)"/
          )
          const title = titleMatch?.[1]?.trim()
          if (!title) continue
          const description = descMatch?.[1]
            ? decodeHtmlEntities(descMatch[1])
            : undefined

          const body = turndown.turndown(mainMatch[1]).trim()
          if (!body) continue

          const slug = relative(distDir, htmlPath)
            .replace(/\.html$/, '')
            .replace(/\/index$/, '')
          const url = slug ? `${siteUrl}/${slug}` : `${siteUrl}/`

          const fm = [
            '---',
            `title: ${JSON.stringify(decodeHtmlEntities(title))}`,
            ...(description
              ? [`description: ${JSON.stringify(description)}`]
              : []),
            `url: ${JSON.stringify(url)}`,
            '---',
          ].join('\n')

          const mdPath = htmlPath.replace(/\.html$/, '.md')
          writeFileSync(mdPath, `${fm}\n\n${body}\n`)
          generated++

          const urlPath = slug ? `/${slug}` : '/'
          const mdUrlPath = slug ? `/${slug}.md` : '/index.md'
          mdPages.push({ urlPath, mdUrlPath })
        }

        // _headers: advertise the .md alternate for each HTML page and
        // serve .md files with the correct content type.
        const sections: string[] = [
          '/*.md\n  Content-Type: text/markdown; charset=utf-8',
        ]
        for (const { urlPath, mdUrlPath } of mdPages) {
          sections.push(
            `${urlPath}\n  Link: <${mdUrlPath}>; rel="alternate"; type="text/markdown"`
          )
        }
        writeFileSync(join(distDir, '_headers'), sections.join('\n\n') + '\n')

        console.log(
          `Generated ${generated} .md files and _headers with ${mdPages.length} entries`
        )
      },
    },
  }
}
