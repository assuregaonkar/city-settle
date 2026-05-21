/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#FAF7F2',
        ink: '#1A1A1A',
        accent: '#C65D3A',
        'accent-soft': '#E8B5A2',
        sage: '#7A9B7E',
        rose: '#D4856F',
        'gray-warm': {
          100: '#F5F1EA',
          300: '#E8E2DA',
          500: '#8B8378',
          700: '#5C5650',
        },
      },
      fontFamily: {
        'instrument-serif': ['InstrumentSerif_400Regular'],
        inter: ['Inter_400Regular'],
        'inter-medium': ['Inter_500Medium'],
        'inter-semibold': ['Inter_600SemiBold'],
        jetbrains: ['JetBrainsMono_400Regular'],
      },
      letterSpacing: {
        tight: '-0.02em',
      },
    },
  },
  plugins: [],
};
