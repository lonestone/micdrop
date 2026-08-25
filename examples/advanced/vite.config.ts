import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  appType: 'mpa',
  root: 'client',
  plugins: [react()],
  server: {
    // host: '0.0.0.0',
    port: 8080,
  },
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
  },
})
