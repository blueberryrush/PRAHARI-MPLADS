/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        stone: {
          950: '#0c0a09',
          900: '#1c1917',
          800: '#292524',
          700: '#44403c',
          200: '#e7e5e4',
          100: '#f5f5f4',
          50: '#fafaf9',
        },
        parchment: '#F8F7F4',
        civic: {
          emerald: '#059669',
          terracotta: '#C85A32',
          amber: '#D97706',
        }
      }
    },
  },
  plugins: [],
}
