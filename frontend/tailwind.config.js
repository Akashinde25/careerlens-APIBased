/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0f172a',
          primary: '#3b82f6',
          green: '#22c55e',
          yellow: '#eab308',
          red: '#ef4444'
        }
      }
    },
  },
  plugins: [
    import('@tailwindcss/forms')
  ],
}
