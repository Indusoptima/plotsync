/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
      },
      backgroundImage: {
        'dotted-grid': 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid-size': '20px 20px',
      },
    },
  },
  plugins: [],
}

