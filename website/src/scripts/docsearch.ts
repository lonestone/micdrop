import docsearch from '@docsearch/js'

/**
 * Mounts Algolia DocSearch into every placeholder that does not have an
 * instance yet.
 *
 * The header is cloned into the mobile drawer, so this runs twice: once for the
 * header, once for the copy. A clone carries the rendered markup of the
 * original without its listeners, so it is emptied before mounting.
 */
export function mountDocSearch() {
  document
    .querySelectorAll<HTMLElement>('[data-docsearch]')
    .forEach((container) => {
      if (container.dataset.mounted) return
      container.dataset.mounted = 'true'
      container.replaceChildren()

      docsearch({
        container,
        ...JSON.parse(container.dataset.docsearch!),
        // Results are absolute URLs on the production domain; keep the reader on
        // the site they are actually browsing.
        transformItems: (items) =>
          items.map((item) => ({ ...item, url: new URL(item.url).pathname })),
      })
    })
}
