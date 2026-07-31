import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/English-Study/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
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
