/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E6F7F7',
          100: '#B3EBEA',
          200: '#80DFDD',
          300: '#4DD3D0',
          400: '#1AC7C3',
          500: '#00A9A5', // Main Primary CTA Color
          600: '#008784',
          700: '#006563',
          800: '#004342',
          900: '#002221',
        },
        surface: {
          DEFAULT: '#FAFAFA',
          card: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '8px',
        'input': '20px',
        'button': '8px',
      },
      spacing: {
        'card': '1.5rem', // 24px
        'section': '2rem', // 32px
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
