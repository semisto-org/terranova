import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const frontendRoot = path.resolve(__dirname, 'app/frontend')

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  root: 'app/frontend',
  base: mode === 'development' ? '/vite-dev/' : '/vite/',
  server: {
    host: 'localhost',
    port: 3036,
    strictPort: true,
  },
  build: {
    manifest: true,
    outDir: '../../public/vite',
    rollupOptions: {
      input: path.resolve(frontendRoot, 'entrypoints/application.js'),
    },
  },
  resolve: {
    alias: {
      '@': frontendRoot,
      '~/': `${frontendRoot}/`,
    },
  },
}))
