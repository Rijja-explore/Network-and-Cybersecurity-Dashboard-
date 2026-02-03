/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'soc-dark': '#0b1220',
        'soc-card': '#111827',
        'soc-text': '#e5e7eb',
        'soc-accent': '#38bdf8',
        'soc-warning': '#facc15',
        'soc-alert': '#ef4444',
        'soc-success': '#22c55e',
      },
    },
  },
  plugins: [],
}
