/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        'inner-lg': '0px 0px 5px 1px rgba(0,0,0,0.5) inset',
        'inner-xl': '0px 0px 10px 2px rgba(0,0,0,0.5) inset',
      },
      keyframes: {
        'pulse-light': {
          '50%': { opacity: 0.97 },
        },
      },
      animation: {
        'pulse-light': 'pulse-light 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
