import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In dev, proxy the backend so the browser stays same-origin (no CORS).
// The FastAPI app serves these routes at the root.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/ask': 'http://localhost:8000',
      '/repos': 'http://localhost:8000',
    },
  },
})
