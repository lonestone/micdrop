import type { Root } from 'mdast'
import { toString } from 'mdast-util-to-string'

/**
 * Drops the leading `# Heading` of a content file when the layout already
 * renders it from the frontmatter `title`.
 *
 * The markdown sources keep their heading so they read as documents on GitHub,
 * while the page shows a single H1.
 */
export default function remarkStripTitle() {
  return (
    tree: Root,
    file: { data?: { astro?: { frontmatter?: Record<string, any> } } }
  ) => {
    const title = file.data?.astro?.frontmatter?.title
    if (!title) return

    const first = tree.children[0]
    if (!first || first.type !== 'heading' || first.depth !== 1) return
    if (toString(first).trim() !== String(title).trim()) return

    tree.children.shift()
  }
}
