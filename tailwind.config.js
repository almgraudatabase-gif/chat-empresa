/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#00a884', dark: '#008069', deeper: '#075e54' },
        bubble: { out: '#d9fdd3', outDark: '#005c4b', in: '#ffffff', inDark: '#202c33' },
        chatbg: { DEFAULT: '#efeae2', dark: '#0b141a' },
        panel: { DEFAULT: '#f0f2f5', dark: '#111b21' },
      },
    },
  },
  plugins: [],
};
