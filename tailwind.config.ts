import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E3F0FF',
          100: '#C2DCFF',
          500: '#1565C0',
          700: '#17375E',
          900: '#003366',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'Malgun Gothic', '맑은 고딕', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
