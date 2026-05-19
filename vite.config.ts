import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Целевая совместимость: поддержка широкого спектра браузеров
    target: ['es2015', 'chrome64', 'firefox78', 'safari12', 'edge79'],
    // CSS совместимость
    cssTarget: ['chrome64', 'firefox78', 'safari12'],
  },
  css: {
    // Включаем autoprefixer через PostCSS
    postcss: {
      plugins: [],
    },
  },
})
