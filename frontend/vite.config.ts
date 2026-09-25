import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Dev only. In production VITE_API_URL points at the deployed API.
    // Override the port when something else already holds 8000.
    proxy: { '/api': process.env.API_PROXY ?? 'http://127.0.0.1:8000' },
  },
})
