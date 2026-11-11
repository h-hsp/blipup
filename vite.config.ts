import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig } from 'vite'

// The camera only works on secure (https) pages, so the local dev server uses a self-signed https certificate
// (the browser warns once; click Advanced → Proceed). Replit's proxy adds its own https, so skip it there.
// shortcut: self-signed cert means a one-time browser warning; use a real cert (or the deployed site) for testers
const https = !process.env.REPL_ID

export default defineConfig({
  plugins: [react(), tailwindcss(), ...(https ? [basicSsl()] : [])],
  // Replit serves on 0.0.0.0 behind its own proxy host
  server: { host: true, allowedHosts: true },
  preview: { host: true, allowedHosts: true },
})
