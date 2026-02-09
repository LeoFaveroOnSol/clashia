/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'opus': '#7C3AED',
        'codex': '#10B981',
        'clash': '#F59E0B',
      },
    },
  },
  plugins: [],
}
