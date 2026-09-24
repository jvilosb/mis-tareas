/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        getram: {
          navy: '#00205B',
          navyDark: '#071b43',
          navyDeep: '#0d2f70',
          blue: '#2b67f6',
          blueSoft: '#edf3ff',
          bg: '#F4F6F9',
          card: '#FFFFFF',
          text: '#10203A',
          muted: '#657184',
          line: '#DBE2E9',
          ok: '#138a57',
          okBg: '#eaf8f1',
          warn: '#b97700',
          warnBg: '#fff5d9',
          down: '#c9362b',
          downBg: '#fff0ee',
        },
      },
      fontFamily: {
        main: ['Lato', 'Segoe UI', 'Arial', 'sans-serif'],
        secondary: ['Mulish', 'Segoe UI', 'Arial', 'sans-serif'],
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        'getram': '0 16px 44px rgba(23, 35, 61, 0.08)',
        'getram-hero': '0 22px 70px rgba(7, 27, 67, 0.22)',
        'getram-hover': '0 20px 48px rgba(23, 35, 61, 0.12)',
      },
    },
  },
  plugins: [],
}
