module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        flip: {
          '0%': { transform: 'rotateX(0deg)', backgroundColor: 'transparent' },
          '50%': { transform: 'rotateX(90deg)', backgroundColor: 'transparent' },
          '100%': { transform: 'rotateX(0deg)' }
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(-5%)' },
          '50%': { transform: 'translateY(0)' }
        }
      },
      animation: {
        'flip-0': 'flip 0.5s ease-in-out',
        'flip-1': 'flip 0.5s ease-in-out 0.1s',
        'flip-2': 'flip 0.5s ease-in-out 0.2s',
        'flip-3': 'flip 0.5s ease-in-out 0.3s',
        'flip-4': 'flip 0.5s ease-in-out 0.4s',
        'bounce-once': 'bounce 0.3s ease-in-out'
      }
    }
  },
  plugins: [],
}