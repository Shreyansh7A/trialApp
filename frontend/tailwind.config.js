/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7ff',
          100: '#ebf0fe',
          200: '#d6e0fd',
          300: '#b3c7fc',
          400: '#8aa6fa',
          500: '#6682f7',
          600: '#4a5eef',
          700: '#3a4ad8',
          800: '#343eaf',
          900: '#2f3a8c',
          950: '#1e234d',
        },
      },
    },
  },
  plugins: [],
};