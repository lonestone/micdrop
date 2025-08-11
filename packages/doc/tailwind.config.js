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
        // Modern AI theme with better contrast
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
        mono: ['SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', 'monospace'],
      },
      animation: {
        'glow': 'glow 3s ease-in-out infinite alternate',
        'float': 'float 4s ease-in-out infinite',
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.15)' },
          '100%': { boxShadow: '0 0 40px rgba(16, 185, 129, 0.3)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
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
    require('tailwindcss/plugin')(function({ addUtilities, addComponents, theme }) {
      // Add custom utilities for AI theme
      addUtilities({
        '.text-glow': {
          textShadow: '0 0 30px rgba(16, 185, 129, 0.4), 0 0 60px rgba(16, 185, 129, 0.2)',
        },
        '.text-glow-sm': {
          textShadow: '0 0 15px rgba(16, 185, 129, 0.3)',
        },
        '.bg-grid': {
          backgroundImage: 'linear-gradient(rgba(148, 163, 184, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.03) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        },
        '.border-glow': {
          boxShadow: '0 0 0 1px rgba(16, 185, 129, 0.2), 0 4px 12px rgba(16, 185, 129, 0.1)',
        },
        '.border-glow-hover': {
          '&:hover': {
            boxShadow: '0 0 0 1px rgba(16, 185, 129, 0.4), 0 8px 32px rgba(16, 185, 129, 0.15)',
          },
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
          '@apply p-8 rounded-2xl bg-gradient-to-br from-ai-surface-800/50 to-ai-surface-900/50 backdrop-blur-sm border border-ai-surface-700/50 transition-all duration-500 hover:border-ai-primary-500/30 animate-slide-up': {},
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 20px 40px rgba(15, 23, 42, 0.3), 0 0 0 1px rgba(16, 185, 129, 0.1)',
          },
        },
        '.ai-badge-core': {
          '@apply inline-flex items-center px-4 py-2 bg-gradient-to-r from-ai-primary-500 to-ai-primary-400 text-white rounded-full text-sm font-semibold uppercase tracking-wider shadow-lg transition-all duration-300': {},
          '&:hover': {
            boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)',
            transform: 'translateY(-2px) scale(1.02)',
          },
        },
        '.ai-badge-ai': {
          '@apply inline-flex items-center px-4 py-2 bg-gradient-to-r from-ai-accent-500 to-ai-accent-400 text-white rounded-full text-sm font-semibold uppercase tracking-wider shadow-lg transition-all duration-300': {},
          '&:hover': {
            boxShadow: '0 8px 25px rgba(14, 165, 233, 0.3)',
            transform: 'translateY(-2px) scale(1.02)',
          },
        },
        '.ai-badge-utility': {
          '@apply inline-flex items-center px-4 py-2 bg-gradient-to-r from-ai-surface-600 to-ai-surface-500 text-white rounded-full text-sm font-semibold uppercase tracking-wider shadow-lg transition-all duration-300': {},
          '&:hover': {
            boxShadow: '0 8px 25px rgba(100, 116, 139, 0.3)',
            transform: 'translateY(-2px) scale(1.02)',
          },
        },
        '.ai-button': {
          '@apply inline-flex items-center px-8 py-4 bg-gradient-to-r from-ai-primary-500 to-ai-primary-400 text-white rounded-xl font-semibold uppercase tracking-wider shadow-xl transition-all duration-300': {},
          '&:hover': {
            transform: 'translateY(-3px) scale(1.02)',
            boxShadow: '0 12px 30px rgba(16, 185, 129, 0.4)',
            backgroundImage: 'linear-gradient(to right, #059669, #10b981)',
          },
        },
        '.ai-button-secondary': {
          '@apply inline-flex items-center px-8 py-4 bg-transparent border-2 border-ai-primary-500 text-ai-primary-400 rounded-xl font-semibold uppercase tracking-wider transition-all duration-300': {},
          '&:hover': {
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderColor: 'rgb(16 185 129)',
            color: 'rgb(16 185 129)',
            transform: 'translateY(-2px)',
          },
        },
      })
    })
  ],
  corePlugins: {
    // Disable preflight to avoid conflicts with Docusaurus
    preflight: false,
  },
}