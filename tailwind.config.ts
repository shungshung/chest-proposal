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
        // 다크 사이드바용 (near-black)
        sidebar: {
          bg: '#0a0a0a',
          hover: '#1a1a1a',
          active: '#252525',
          border: '#2a2a2a',
          text: '#a0a0a0',
          textActive: '#ffffff',
        },
        // 브랜드 강조색 (진한 남색 유지, 버튼/뱃지용)
        brand: {
          900: '#003366',
          700: '#17375E',
          500: '#1565C0',
          100: '#E3F0FF',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'Malgun Gothic', '맑은 고딕', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
    },
  },
  plugins: [],
}
export default config
