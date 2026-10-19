import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// 설정 화면에 표시해 폰에서 어느 버전이 실행 중인지 확인할 수 있게 한다.
const buildSha = (process.env.GITHUB_SHA ?? 'dev').slice(0, 7)
const buildDate = new Date().toISOString().slice(0, 16).replace('T', ' ')

// https://vite.dev/config/
export default defineConfig({
  base: '/English-Study/',
  define: {
    __APP_VERSION__: JSON.stringify(`${buildSha} · ${buildDate} UTC`),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // main.tsx에서 직접 등록해 새 버전이 오면 즉시 새로고침한다.
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icons/icon.svg'],
      manifest: {
        name: '매일 영어 스피킹',
        short_name: '영어스피킹',
        description: '수준·주제 기반 영어 지문 자동 생성, 독해, 단어학습, 스피킹 연습을 하루 한 번 학습하는 웹앱',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/English-Study/',
        scope: '/English-Study/',
        icons: [
          {
            src: 'icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'icons/icon-maskable.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,json}'],
        navigateFallbackDenylist: [/^\/api/],
      },
    }),
  ],
})
