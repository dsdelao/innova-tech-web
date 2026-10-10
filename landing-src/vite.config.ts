import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Por defecto compila a /landing/. Para servir la landing en la raiz,
  // ejecutar con LANDING_BASE=/ LANDING_OUTDIR=../.landing-root
  base: process.env.LANDING_BASE || '/landing/',
  build: {
    outDir: process.env.LANDING_OUTDIR || '../landing',
    emptyOutDir: true,
    assetsDir: 'assets',
  },
})
