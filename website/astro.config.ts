import type { RehypePlugins, RemarkPlugins } from 'astro'
import { defineConfig } from 'astro/config'
import { unified } from '@astrojs/markdown-remark'
import mdx from '@astrojs/mdx'
import netlify from '@astrojs/netlify'
import sitemap from '@astrojs/sitemap'
import expressiveCode from 'astro-expressive-code'
import { redirects } from './src/redirects'
import rehypeMdClass from './src/utils/rehype-md-class'
import rehypeMermaid from './src/utils/rehype-mermaid'
import remarkAdmonitions from './src/utils/remark-admonitions'
import remarkDocLinks from './src/utils/remark-doc-links'
import remarkStripTitle from './src/utils/remark-strip-title'
import enrichMd from './src/integrations/enrich-md'
import config from './website.config'

const { site } = config

// The same plugin lists feed two APIs with subtly different types:
// `markdown.processor = unified({...})` for plain `.md` and the `mdx()`
// integration for `.mdx` (mdx@5 reads neither the deprecated top-level fields
// nor `processor`, only its own options). Astro's plugin types allow bare
// `string` specifiers that mdx's `PluggableList` rejects, so drop that member
// to get one type assignable to both.
type Plugins<T extends unknown[]> = Exclude<
  T[number],
  string | [string, unknown]
>[]

const remarkPlugins: Plugins<RemarkPlugins> = [
  remarkStripTitle,
  remarkAdmonitions,
  remarkDocLinks,
]

// `rehypeMdClass` tags every markdown element with `.md`, then `rehypeMermaid`
// reclaims the diagram blocks it would otherwise style as code.
const rehypePlugins: Plugins<RehypePlugins> = [rehypeMdClass, rehypeMermaid]

export default defineConfig({
  site,
  adapter: netlify({
    // Netlify's on-demand image service only exists on their production
    // runtime, so `pnpm dev` would get broken image URLs. Enable it only
    // when building for production.
    imageCDN: process.env.NODE_ENV === 'production',
    edgeMiddleware: false,
  }),
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  redirects,
  markdown: {
    // Astro 6 replaced the deprecated top-level `remarkPlugins` /
    // `rehypePlugins` fields with `markdown.processor = unified({...})`, which
    // drives plain `.md` files.
    processor: unified({ remarkPlugins, rehypePlugins, gfm: true }),
  },
  integrations: [
    // Every code block on the site: the markdown fences and the `<Code>` of the
    // hero. Mermaid fences carry a diagram rather than code, so they stay out
    // of the highlighter and `rehypeMermaid` picks them up untouched.
    // Options live in ec.config.mjs, which `<Code>` loads on its own.
    expressiveCode(),
    // mdx@5 does not read `markdown.processor`, only its own options, so mirror
    // the same lists here for `.mdx` files. `gfm` must be set explicitly: with a
    // custom `markdown.processor`, Astro no longer surfaces the `gfm: true`
    // default on `config.markdown`, so the mdx integration would otherwise
    // resolve it to `undefined` and drop remark-gfm (breaking tables).
    mdx({ remarkPlugins, rehypePlugins, gfm: true }),
    sitemap(),
    enrichMd(),
  ],
  vite: {
    optimizeDeps: {
      // Both are loaded lazily, Mermaid only on the pages holding a diagram and
      // DocSearch only once the reader opens it. Left to discover them on the
      // fly, the dev server re-optimizes mid-session and the page that asked
      // for them gets a stale module (504 Outdated Optimize Dep). Pre-bundling
      // them at start-up keeps that from happening.
      include: ['mermaid', '@docsearch/js'],
    },
  },
})
