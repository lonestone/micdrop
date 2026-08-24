import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  appType: 'mpa',
  plugins: [react()],
  server: {
    port: 8082,
  },
  build: {
    outDir: 'dist/client',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        test: resolve(__dirname, 'test.html'),
      },
    },
  },
})
