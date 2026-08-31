import { defineEcConfig } from 'astro-expressive-code'

/**
 * Expressive Code renders every code block on the site: the markdown fences in
 * the docs and the snippets of the `<Code>` component in the hero.
 *
 * The options live here rather than in `astro.config.ts` because `<Code>`
 * requires a config it can load on its own, which rules out passing them
 * inline (`themeCssSelector` is a function, so it cannot be serialized).
 */
export default defineEcConfig({
  // A muted, green-leaning pair rather than the loud editor defaults: the code
  // has to sit inside an emerald and slate page without turning into a rainbow,
  // in the hero as much as in the documentation. Expressive Code emits both and
  // switches on the `data-theme` attribute of `<html>`.
  themes: ['vitesse-dark', 'vitesse-light'],
  themeCssSelector: (theme) => `[data-theme='${theme.type}']`,
  useDarkModeMediaQuery: false,
  defaultProps: { wrap: false },
  styleOverrides: {
    borderRadius: '0.75rem',
    codeFontFamily: 'var(--font-mono)',
    uiFontFamily: 'var(--font-sans)',
    // Both themes ship their own surface, warm grey for one-dark-pro, which
    // reads as a foreign panel on the slate background. Only the token colours
    // are kept; the surfaces come from the site palette and follow the theme on
    // their own.
    codeBackground: 'var(--bg-secondary)',
    borderColor: 'var(--border)',
    scrollbarThumbColor: 'var(--border)',
    scrollbarThumbHoverColor: 'var(--primary)',
    frames: {
      editorBackground: 'var(--bg-secondary)',
      editorTabBarBackground: 'var(--bg-elevated)',
      editorTabBarBorderBottomColor: 'var(--border)',
      editorActiveTabBackground: 'var(--bg-secondary)',
      editorActiveTabBorderColor: 'var(--border)',
      editorActiveTabIndicatorTopColor: 'var(--primary)',
      terminalBackground: 'var(--bg-secondary)',
      terminalTitlebarBackground: 'var(--bg-elevated)',
      terminalTitlebarBorderBottomColor: 'var(--border)',
      terminalTitlebarForeground: 'var(--text-secondary)',
    },
  },
  shiki: { langs: [] },
})
