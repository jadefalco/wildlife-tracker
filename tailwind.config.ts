import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        nature: {
          50: '#f2f9f1',
          100: '#e0f0de',
          200: '#c2e1bf',
          300: '#96cb92',
          400: '#65ad60',
          500: '#43913e',
          600: '#31742e',
          700: '#295c27',
          800: '#244a23',
          900: '#1e3d1e',
        },
        earth: {
          50: '#fbf7f4',
          100: '#f5ece3',
          200: '#ebd7c5',
          300: '#debb9d',
          400: '#cf996f',
          500: '#c47e4e',
          600: '#b86740',
          700: '#995035',
          800: '#7d4230',
          900: '#65382b',
        },
      },
    },
  },
  plugins: [],
};

export default config;
