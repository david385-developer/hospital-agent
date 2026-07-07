/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        'navy-950': '#0a0e1a',
        'navy-900': '#111827',
        'slate-800': '#1e293b',
        'slate-700': '#334155',
        'blue-500': '#3b82f6',
        'blue-600': '#2563eb',
        'red-500': '#ef4444',
        'amber-500': '#f59e0b',
        'green-500': '#22c55e',
        'purple-500': '#a855f7',
        'orange-500': '#f97316',
        'teal-500': '#14b8a6'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.5)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        'agent-running': {
          '0%': { opacity: '1' },
          '50%': { opacity: '0.5' },
          '100%': { opacity: '1' }
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' }
        }
      },
      animation: {
        'pulse-ring': 'pulse-ring 2s infinite',
        'fade-in-up': 'fade-in-up 0.4s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
        'agent-running': 'agent-running 1.5s infinite',
        'scan-line': 'scan-line 3s linear infinite'
      }
    }
  },
  plugins: []
}
