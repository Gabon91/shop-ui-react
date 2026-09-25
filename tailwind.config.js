/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17211b',
        paper: '#f7f5ef',
        moss: '#315c48',
        lime: '#d9f99d',
      },
      boxShadow: {
        card: '0 18px 50px rgba(23, 33, 27, 0.08)',
      },
    },
  },
  plugins: [],
}
