import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      {
        find: 'monaco-editor/esm/vs/editor/editor.api.js',
        replacement: path.resolve(
          rootDir,
          'node_modules/monaco-editor/esm/vs/editor/editor.api.js'
        ),
      },
    ],
    dedupe: ['monaco-editor', 'yjs'],
  },
  optimizeDeps: {
    exclude: ['y-monaco'],
  },
})