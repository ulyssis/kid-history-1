import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages project site: https://<user>.github.io/kid-history-1/
const pagesBase = '/kid-history-1/'

export default defineConfig({
  // Only apply the Pages subpath in CI; keep `/` for local `npm run dev`
  base: process.env.GITHUB_ACTIONS ? pagesBase : '/',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
})
