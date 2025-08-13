/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './docs/**/*.{md,mdx}',
    './blog/**/*.{md,mdx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Modern AI theme
        'ai-accent': {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        'ai-primary': {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        'ai-surface': {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        // Add border and background variants for better integration
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
      },
      fontFamily: {
        mono: [
          'SFMono-Regular',
          'Consolas',
          'Liberation Mono',
          'Menlo',
          'monospace',
        ],
      },
      animation: {
        'shadow-glow': 'shadow-glow 3s ease-in-out infinite',
        'border-glow': 'border-glow 2s ease-in-out infinite',
        'text-glow': 'text-glow 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'shadow-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.15)' },
          '50%': { boxShadow: '0 0 40px rgba(16, 185, 129, 0.3)' },
        },
        'border-glow': {
          '0%, 100%': {
            border: '2px solid rgba(16, 185, 129, 0.8)',
          },
          '50%': {
            border: '2px solid rgba(16, 185, 129, 0.4)',
          },
        },
        'text-glow': {
          '0%, 100%': { textShadow: '0 0 30px rgba(16, 185, 129, 0.6)' },
          '50%': { textShadow: '0 0 20px rgba(16, 185, 129, 0.4)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [
    require('tailwindcss/plugin')(function ({ addUtilities, addComponents }) {
      // Add custom utilities for AI theme
      addUtilities({
        '.shadow-glow': {
          '@apply animate-shadow-glow': {},
        },
        '.border-glow': {
          '@apply animate-border-glow border-2': {},
        },
        '.text-glow': {
          '@apply animate-text-glow': {},
        },
        '.bg-grid': {
          backgroundImage:
            'linear-gradient(rgba(148, 163, 184, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.03) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        },
        '.glass': {
          backgroundColor: 'rgba(148, 163, 184, 0.05)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(148, 163, 184, 0.1)',
        },
      })

      // Add reusable component classes
      addComponents({
        '.ai-card': {
          '@apply p-8 rounded-2xl backdrop-blur-sm animate-slide-up border-glow bg-ai-surface-100 dark:bg-ai-surface-800':
            {},
        },
        '.ai-badge-core': {
          '@apply inline-flex items-center px-4 py-2 bg-gradient-to-r from-ai-primary-500 to-ai-primary-400 dark:from-ai-primary-900 dark:to-ai-primary-800 text-white rounded-full text-sm font-semibold shadow-lg transition-all duration-300 no-underline':
            {},
          '&:hover': {
            boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)',
            transform: 'translateY(-2px) scale(1.02)',
            textDecoration: 'none',
            color: 'white',
          },
        },
        '.ai-badge-ai': {
          '@apply inline-flex items-center px-4 py-2 bg-gradient-to-r from-ai-accent-500 to-ai-accent-400 dark:from-ai-accent-900 dark:to-ai-accent-800 text-white rounded-full text-sm font-semibold shadow-lg transition-all duration-300 no-underline':
            {},
          '&:hover': {
            boxShadow: '0 8px 25px rgba(14, 165, 233, 0.3)',
            transform: 'translateY(-2px) scale(1.02)',
            textDecoration: 'none',
            color: 'white',
          },
        },
        '.ai-badge-utility': {
          '@apply inline-flex items-center px-4 py-2 bg-gradient-to-r from-ai-surface-600 to-ai-surface-500 dark:from-ai-surface-700 dark:to-ai-surface-600 text-white rounded-full text-sm font-semibold shadow-lg transition-all duration-300 no-underline':
            {},
          '&:hover': {
            boxShadow: '0 8px 25px rgba(100, 116, 139, 0.3)',
            transform: 'translateY(-2px) scale(1.02)',
            textDecoration: 'none',
            color: 'white',
          },
        },
        '.ai-button': {
          '@apply inline-flex items-center px-8 py-4 bg-gradient-to-r from-ai-primary-500 to-ai-primary-400 dark:from-ai-primary-600 dark:to-ai-primary-500 text-white rounded-xl font-semibold shadow-xl transition-all duration-300 no-underline':
            {},
          '&:hover': {
            transform: 'translateY(-3px) scale(1.02)',
            boxShadow: '0 12px 30px rgba(16, 185, 129, 0.4)',
            textDecoration: 'none',
            color: 'white',
          },
        },
        '.ai-button-secondary': {
          '@apply inline-flex items-center px-8 py-4 bg-transparent border-2 border-ai-primary-500 text-ai-primary-400 rounded-xl font-semibold transition-all duration-300 no-underline':
            {},
          '&:hover': {
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderColor: 'rgb(16 185 129)',
            color: 'rgb(16 185 129)',
            transform: 'translateY(-2px)',
            textDecoration: 'none',
          },
        },
        '.tab-content': {
          '@apply border-glow': {},
          borderTop: 'none !important',
        },
        '.tab-inactive': {
          '@apply border-glow': {},
          borderTop: 'none !important',
          borderLeft: 'none !important',
          borderRight: 'none !important',
        },
        '.tab-active': {
          '@apply border-glow': {},
          borderBottom: 'none !important',
        },
      })
    }),
  ],
  corePlugins: {
    // Disable preflight to avoid conflicts with Docusaurus
    preflight: false,
  },
}
