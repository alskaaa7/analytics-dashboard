import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/analytics-dashboard/', // Важно! Название репозитория
  build: {
    outDir: 'dist'
  }
})