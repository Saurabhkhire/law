/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          500: '#4f6ef7',
          600: '#3b5af5',
          700: '#2d47e0',
          900: '#1a2b8c'
        }
      }
    }
  },
  plugins: []
};
