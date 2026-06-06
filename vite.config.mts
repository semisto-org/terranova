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
    port: 30362,
    strictPort: true,
  },
  build: {
    manifest: true,
    sourcemap: false,
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
    // TipTap (existing) and Milkdown/Crepe (design-system RichTextField) both
    // depend on ProseMirror. Yarn installs duplicate copies of some prosemirror-*
    // packages, and two prosemirror-gapcursor copies each try to register the
    // "gapcursor" selection JSON ID against the single prosemirror-state, throwing
    // "Duplicate use of selection JSON ID gapcursor" and blanking the app.
    // Dedupe forces a single copy of each so the registration happens once.
    dedupe: [
      'prosemirror-state',
      'prosemirror-view',
      'prosemirror-model',
      'prosemirror-transform',
      'prosemirror-gapcursor',
      'prosemirror-keymap',
      'prosemirror-commands',
      'prosemirror-history',
      'prosemirror-inputrules',
      'prosemirror-schema-list',
    ],
  },
}))
