/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.{html,js}"],
  theme: {
    extend: {
      fontFamily: { sans: ['Manrope', 'sans-serif'], display: ['Sora', 'sans-serif'] },
      colors: { forest: '#29463a', moss: '#5f7458', clay: '#aa7d52', sand: '#ede4d4', cream: '#f8f4ec', ink: '#1f2924' },
      boxShadow: { soft: '0 22px 60px rgba(41,70,58,0.12)', glass: '0 18px 48px rgba(18,30,24,0.22)', lift: '0 30px 80px rgba(31,41,36,0.18)' }
    }
  },
  plugins: [],
}
