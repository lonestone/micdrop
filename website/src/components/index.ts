// Auto-discover every .astro component in this folder (recursively).
// Anything dropped here becomes usable inside MDX content without an import.
// See <Content components={mdxComponents} /> in the BlogPost / DocPage layouts.
const modules = import.meta.glob('./**/*.astro', { eager: true })

export const mdxComponents: Record<string, any> = Object.fromEntries(
  Object.entries(modules).map(([path, mod]) => [
    path.split('/').pop()!.replace('.astro', ''),
    (mod as any).default,
  ])
)
