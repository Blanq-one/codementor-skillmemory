import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// In dev, proxy the backend so the browser stays same-origin (no CORS).
// The FastAPI app serves these routes at the root.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/ask': 'http://localhost:8000',
      '/repos': 'http://localhost:8000',
      '/analyze-repo': 'http://localhost:8000',
      '/skills': 'http://localhost:8000',
    },
  },
})
