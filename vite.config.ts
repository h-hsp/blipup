import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Replit serves on 0.0.0.0 behind its own proxy host
  server: { host: true, allowedHosts: true },
  preview: { host: true, allowedHosts: true },
})
