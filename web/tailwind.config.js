/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom color palette for rich aesthetics (Sahayak theme)
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc8fc',
          400: '#36adf7',
          500: '#0c92e7',
          600: '#0075c3',
          700: '#025da0',
          800: '#074f83',
          900: '#0c426e',
          950: '#082b4a',
        },
      },
    },
  },
  plugins: [],
}
