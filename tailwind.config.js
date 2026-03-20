/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html"],
  theme: {
    extend: {
      colors: {
        charcoal: '#0a0a0c',
        gunmetal: '#1c1e22',
        gold: { 400: '#f8c176', 500: '#d9a046', 600: '#b88230' }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Montserrat', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow': '0 0 20px rgba(248, 193, 118, 0.15)',
      }
    }
  },
  plugins: [],
}
