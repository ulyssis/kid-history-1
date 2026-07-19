import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/kid-history-1/' : '/',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
})
