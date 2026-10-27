import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves the site under /Cardify/; Cloudflare Pages serves it at the root.
// Cloudflare sets CF_PAGES=1 during its builds, so the right path is picked automatically.
export default defineConfig({
  base: process.env.CF_PAGES ? '/' : '/Cardify/',
  plugins: [react()],
})
