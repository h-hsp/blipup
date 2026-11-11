import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig } from 'vite'

// The camera needs a secure page. http://localhost already counts, so `npm run dev` stays plain http (no warning).
// `npm run dev:phone` adds a self-signed https cert so a phone on the same WiFi can use the camera.
// shortcut: self-signed cert shows a browser warning on the phone; the deployed site has a real cert
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), ...(mode === 'phone' ? [basicSsl()] : [])],
  // Replit serves on 0.0.0.0 behind its own proxy host
  server: { host: true, allowedHosts: true },
  preview: { host: true, allowedHosts: true },
}))
