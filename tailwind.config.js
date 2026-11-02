/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          aqua: '#7FFFD4',
          light: '#4299e1',
          medium: '#3182ce',
          blue: '#0000FF',
          navy: '#000080',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Be Vietnam Pro"', 'sans-serif'],
      },
      keyframes: {
        floatBubble: {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px) scale(1)' },
          '33%': { transform: 'translateY(-18px) translateX(8px) scale(1.03)' },
          '66%': { transform: 'translateY(-8px) translateX(-8px) scale(0.98)' },
        },
        shimmer: {
          '0%': { opacity: '0.4' },
          '50%': { opacity: '0.85' },
          '100%': { opacity: '0.4' },
        },
      },
      animation: {
        'float-slow': 'floatBubble 9s ease-in-out infinite',
        'float-medium': 'floatBubble 6s ease-in-out infinite',
        'shimmer': 'shimmer 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

