/** @type {import('tailwindcss').Config} */
/* eslint-env node */
// TODO: upgrade to ESM when storybook v7 vite handles it correctly
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        'inner-xl': '0px 0px 30px -10px rgba(0,0,0,0.5) inset',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
