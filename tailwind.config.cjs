module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        matte: '#000000',
        charcoal: '#1A1A1A',
        accent: '#FF7A00',
        soft: '#F5F5F5'
      },
      boxShadow: {
        glow: '0 10px 30px rgba(255,106,0,0.12), 0 2px 8px rgba(0,0,0,0.6)'
      }
    }
  },
  plugins: []
}
