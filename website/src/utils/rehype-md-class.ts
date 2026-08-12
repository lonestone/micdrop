import { visit } from 'unist-util-visit'
import type { Root, Element } from 'hast'

/**
 * Rehype plugin that adds the "md" class to every HTML element generated
 * from markdown. Styles in global.css target `.md` so markdown prose picks
 * up typography rules without bleeding into component markup (hero, cards, etc.).
 */
export default function rehypeMdClass() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (!node.properties) {
        node.properties = {}
      }
      const classes = node.properties.className
      if (Array.isArray(classes)) {
        classes.push('md')
      } else if (typeof classes === 'string') {
        node.properties.className = [classes, 'md']
      } else {
        node.properties.className = ['md']
      }
    })
  }
}
