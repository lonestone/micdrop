import type { Element, Root } from 'hast'
import { visit } from 'unist-util-visit'

/**
 * Turns ```mermaid fences into `<pre class="mermaid">` blocks.
 *
 * The fences are kept out of the syntax highlighter (see `excludeLangs` in
 * astro.config.ts), so their text arrives untouched. Rendering happens in the
 * browser: `DocsLayout` loads Mermaid only on pages that contain a diagram.
 */
export default function rehypeMermaid() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'pre') return

      const code = node.children.find(
        (child): child is Element =>
          child.type === 'element' && child.tagName === 'code'
      )
      if (!code) return

      const classes = code.properties?.className
      const list = Array.isArray(classes) ? classes.map(String) : []
      if (!list.includes('language-mermaid')) return

      const source = code.children
        .filter((child) => child.type === 'text')
        .map((child) => (child as { value: string }).value)
        .join('')

      // Replace the whole <pre><code> pair: Mermaid reads the element's text
      // content and swaps it for the rendered SVG.
      node.properties = { className: ['mermaid'] }
      node.children = [{ type: 'text', value: source }]
    })
  }
}
