import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Custom domain (history4kids.org) serves from site root.
export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
})
