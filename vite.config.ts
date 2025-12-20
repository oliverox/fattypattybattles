import { defineConfig } from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import tsconfigPaths from 'vite-tsconfig-paths'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    tsconfigPaths(),
    tanstackStart(),
    react(),
  ],
  resolve: {
    alias: {
      // Fix for React 19 compatibility - useSyncExternalStore is now built into React
      'use-sync-external-store/shim/index.js': resolve(__dirname, 'src/shims/use-sync-external-store-shim.ts'),
      'use-sync-external-store/shim/with-selector.js': resolve(__dirname, 'src/shims/use-sync-external-store-with-selector.ts'),
      'use-sync-external-store/shim/with-selector': resolve(__dirname, 'src/shims/use-sync-external-store-with-selector.ts'),
      'use-sync-external-store/shim': resolve(__dirname, 'src/shims/use-sync-external-store-shim.ts'),
    },
  },
})
