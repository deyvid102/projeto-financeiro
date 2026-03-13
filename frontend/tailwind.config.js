/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Mapeia as suas variáveis do index.css para classes do Tailwind
        accent: 'var(--accent)',
        'accent-bg': 'var(--accent-bg)',
        'text-h': 'var(--text-h)',
        text: 'var(--text)',
        border: 'var(--border)',
      },
    },
  },
  plugins: [],
}