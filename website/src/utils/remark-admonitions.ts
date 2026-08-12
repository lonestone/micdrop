import type { Paragraph, Parent, Root, RootContent, Text } from 'mdast'

/**
 * Docusaurus-style admonitions for plain markdown:
 *
 * ```md
 * :::tip Optional title
 * Body of the callout.
 * :::
 * ```
 *
 * The fences become a `div.admonition.admonition-<kind>` wrapper with a title
 * row, styled in `global.css`. Keeping the syntax means the docs read the same
 * in the repository as they do on the site, and MDX pages can still reach for
 * the richer `<Callout>` component.
 */

/** Emoji and default title per kind, mirroring the previous docs site. */
const KINDS = {
  note: { emoji: 'ℹ️', title: 'Note' },
  info: { emoji: 'ℹ️', title: 'Info' },
  tip: { emoji: '💡', title: 'Tip' },
  warning: { emoji: '⚠️', title: 'Warning' },
  caution: { emoji: '⚠️', title: 'Caution' },
  danger: { emoji: '🚨', title: 'Danger' },
} as const

type Kind = keyof typeof KINDS

const OPEN_LINE = /^:::([a-z]+)[ \t]*(.*)$/
const CLOSE_LINE = /^:::[ \t]*$/

/**
 * Markers stand in for the fence lines between the two passes below, and the
 * container node carries the result. None of the three is part of mdast, so
 * they travel in their own union and are cast back on the way out; the
 * container reaches HTML through the `hName` / `hProperties` hints that
 * mdast-util-to-hast reads from unknown nodes.
 */
type Marker =
  | { type: 'admonitionOpen'; kind: Kind; title: string }
  | { type: 'admonitionClose' }

type Node = RootContent | Marker

const isMarker = (node: Node, type: Marker['type']): boolean =>
  (node as Marker).type === type

const hasChildren = (node: RootContent): node is RootContent & Parent =>
  Array.isArray((node as Parent).children)

/**
 * Turn the `:::` lines into standalone marker nodes.
 *
 * A fence may sit in its own paragraph (blank line around it) or share the
 * paragraph with the body (no blank line), so both the first and the last text
 * child of every paragraph are inspected.
 */
function extractMarkers(children: RootContent[]): Node[] {
  const out: Node[] = []

  for (const node of children) {
    if (node.type !== 'paragraph') {
      out.push(node)
      continue
    }

    const paragraph = node as Paragraph
    const before: Marker[] = []
    const after: Marker[] = []

    const first = paragraph.children[0]
    if (first?.type === 'text') {
      const [firstLine, ...rest] = first.value.split('\n')
      const match = firstLine.match(OPEN_LINE)
      if (match && match[1] in KINDS) {
        before.push({
          type: 'admonitionOpen',
          kind: match[1] as Kind,
          title: match[2].trim(),
        })
        first.value = rest.join('\n')
      }
    }

    const last = paragraph.children[paragraph.children.length - 1]
    if (last?.type === 'text') {
      const lines = last.value.split('\n')
      if (CLOSE_LINE.test(lines[lines.length - 1])) {
        after.push({ type: 'admonitionClose' })
        last.value = lines.slice(0, -1).join('\n')
      }
    }

    out.push(...before)
    // A paragraph reduced to a single empty text node held nothing but fences.
    const onlyFences =
      paragraph.children.length === 1 &&
      paragraph.children[0].type === 'text' &&
      (paragraph.children[0] as Text).value.trim() === ''
    if (!onlyFences) out.push(paragraph)
    out.push(...after)
  }

  return out
}

/** Wrap every open/close pair into a single container node. */
function wrap(children: Node[]): RootContent[] {
  const out: RootContent[] = []
  let index = 0

  while (index < children.length) {
    const node = children[index]

    if (!isMarker(node, 'admonitionOpen')) {
      // A stray close marker (unbalanced fence) is simply dropped.
      if (!isMarker(node, 'admonitionClose')) out.push(node as RootContent)
      index++
      continue
    }

    const open = node as Extract<Marker, { type: 'admonitionOpen' }>
    const body: Node[] = []
    let end = index + 1
    while (
      end < children.length &&
      !isMarker(children[end], 'admonitionClose')
    ) {
      body.push(children[end])
      end++
    }

    const { emoji, title } = KINDS[open.kind]
    out.push({
      type: 'admonition',
      data: {
        hName: 'div',
        hProperties: { className: ['admonition', `admonition-${open.kind}`] },
      },
      children: [
        {
          type: 'paragraph',
          data: {
            hName: 'div',
            hProperties: { className: ['admonition-title'] },
          },
          children: [
            { type: 'text', value: `${emoji} ${open.title || title}` },
          ],
        },
        ...wrap(body),
      ],
    } as unknown as RootContent)

    index = end + 1
  }

  return out
}

/** Depth-first, so admonitions nested in lists or quotes are handled too. */
function transform(node: Root | (RootContent & Parent)) {
  node.children = wrap(extractMarkers(node.children as RootContent[])) as never
  for (const child of node.children as RootContent[]) {
    if (hasChildren(child)) transform(child)
  }
}

export default function remarkAdmonitions() {
  return (tree: Root) => transform(tree)
}
