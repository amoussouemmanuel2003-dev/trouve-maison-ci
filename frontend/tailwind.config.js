/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Charte moderne Côte d'Ivoire (Orange chaleureux, Vert émeraude/nature, Neutres élégants)
        ci: {
          orange: '#FF8200',
          'orange-hover': '#E67300',
          green: '#009A44',
          'green-dark': '#007A34',
          night: '#0F172A',
          card: '#1E293B',
          sand: '#F8FAFC',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
