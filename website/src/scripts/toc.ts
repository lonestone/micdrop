/**
 * Highlights the table of contents entry whose heading is currently in view.
 * Shared by the docs rail (`Toc`) and the article rail (`BlogSidebar`), which
 * both mark their nav with `data-toc`.
 */
export function initToc() {
  const nav = document.querySelector('[data-toc]')
  if (!nav) return

  const links = nav.querySelectorAll<HTMLAnchorElement>('a[data-heading]')
  const targets = Array.from(links)
    .map((link) => document.getElementById(link.dataset.heading!))
    .filter((element): element is HTMLElement => element !== null)

  if (targets.length === 0) return

  // The blog rail swaps the list for a <select> when it collapses; keep both
  // pointing at the same heading.
  const select = document.getElementById(
    'toc-select'
  ) as HTMLSelectElement | null

  const handleScroll = () => {
    let active = targets[0].id
    for (const target of targets) {
      if (target.getBoundingClientRect().top <= 120) active = target.id
    }
    links.forEach((link) => {
      const on = link.dataset.heading === active
      link.classList.toggle('text-primary', on)
      link.classList.toggle('font-medium', on)
      link.classList.toggle('text-text-secondary', !on)
    })
    if (select) select.value = active
  }

  handleScroll()
  document.addEventListener('scroll', handleScroll, { passive: true })
}
