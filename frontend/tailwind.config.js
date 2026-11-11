/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: {
          indigo: '#6366F1',
          violet: '#8B5CF6',
          50: '#EEF2FF',
          100: '#E0E7FF',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
        },
        rating: {
          forgot: {
            DEFAULT: '#F43F5E', // rose-500
            light: '#FFE4E6',
            dark: '#881337',
          },
          shaky: {
            DEFAULT: '#F59E0B', // amber-500
            light: '#FEF3C7',
            dark: '#78350F',
          },
          easy: {
            DEFAULT: '#10B981', // emerald-500
            light: '#D1FAE5',
            dark: '#064E3B',
          },
        },
      },
      boxShadow: {
        'soft': '0 2px 12px -2px rgba(0, 0, 0, 0.06), 0 4px 8px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 12px 30px -4px rgba(0, 0, 0, 0.08), 0 8px 12px -4px rgba(0, 0, 0, 0.03)',
        'soft-dark': '0 4px 20px -2px rgba(0, 0, 0, 0.4)',
        'brand-glow': '0 4px 20px -2px rgba(99, 102, 241, 0.35)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out forwards',
        'slide-up': 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
