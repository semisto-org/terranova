import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const frontendRoot = path.resolve(__dirname, 'app/frontend')

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    ...(mode === 'production' && process.env.SENTRY_AUTH_TOKEN
      ? [sentryVitePlugin({
          org: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          authToken: process.env.SENTRY_AUTH_TOKEN,
        })]
      : []),
  ],
  root: 'app/frontend',
  base: mode === 'development' ? '/vite-dev/' : '/vite/',
  server: {
    host: 'localhost',
    port: 3036,
    strictPort: true,
  },
  build: {
    manifest: true,
    sourcemap: true,
    outDir: '../../public/vite',
    rollupOptions: {
      input: path.resolve(frontendRoot, 'entrypoints/application.jsx'),
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', '@inertiajs/react'],
          editor: ['@tiptap/react', '@tiptap/starter-kit', '@tiptap/extension-link'],
          dnd: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          maps: ['leaflet', 'react-leaflet'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': frontendRoot,
      '~/': `${frontendRoot}/`,
    },
  },
}))
