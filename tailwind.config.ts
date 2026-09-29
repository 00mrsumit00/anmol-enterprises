import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#FF6B00',
          'orange-dark': '#E05C00',
          'orange-light': '#FFF3E6',
          yellow: '#FFD600',
          charcoal: '#1A1A2E',
          'charcoal-soft': '#16213E',
        },
        ice: {
          blue: '#E8F4FD',
          'blue-dark': '#B3D9F5',
        },
      },
      fontFamily: {
        display: ['var(--font-poppins)', 'Poppins', 'sans-serif'],
        body: ['var(--font-dm-sans)', 'DM Sans', 'sans-serif'],
        accent: ['var(--font-baloo-2)', 'Baloo 2', 'cursive'],
      },
      borderRadius: {
        card: '16px',
        pill: '100px',
        drawer: '24px',
      },
    },
  },
  plugins: [],
} satisfies Config
