/**
 * The demo reads its colours from the semantic tokens declared in
 * `client/src/index.css`, so switching the theme is one attribute on `<html>`
 * rather than a `dark:` variant on every utility. Tokens hold finished colour
 * values, which rules out the `/50` opacity shorthand: anything translucent
 * gets its own `-soft` token.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ['./client/index.html', './client/src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Surfaces, from the page down to the sunken wells inside a card
        base: 'var(--base)',
        panel: 'var(--panel)',
        raised: 'var(--raised)',
        inset: 'var(--inset)',
        line: 'var(--line)',
        'line-strong': 'var(--line-strong)',
        knob: 'var(--knob)',

        // Text, from the reading size down to the labels
        main: 'var(--main)',
        dim: 'var(--dim)',
        faint: 'var(--faint)',

        // Emerald carries the live signal: the call is up, the mic hears you
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        'accent-ink': 'var(--accent-ink)',
        'on-accent': 'var(--on-accent)',

        // Sky is the other voice in the room, the one the assistant speaks in
        voice: 'var(--voice)',
        'voice-soft': 'var(--voice-soft)',
        'voice-ink': 'var(--voice-ink)',

        // Amber waits, red stops. Neither ever decorates anything
        warn: 'var(--warn)',
        'warn-soft': 'var(--warn-soft)',
        danger: 'var(--danger)',
        'danger-soft': 'var(--danger-soft)',
      },
      borderRadius: {
        // Two steps and no more: `xl` on panels, `lg` on controls
        xl: '0.75rem',
        lg: '0.5rem',
      },
      transitionTimingFunction: {
        // The single curve the demo animates on
        rise: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        rise: {
          from: { opacity: '0', transform: 'translateY(0.5rem)' },
        },
        breathe: {
          '50%': { opacity: '0.35', transform: 'scale(1.08)' },
        },
      },
      animation: {
        rise: 'rise 0.35s cubic-bezier(0.16, 1, 0.3, 1) backwards',
        breathe: 'breathe 2.4s cubic-bezier(0.16, 1, 0.3, 1) infinite',
      },
    },
  },
  plugins: [],
}
