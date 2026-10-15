import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    // The matrix data (all per-engine JSON) is intentionally isolated into its
    // own chunk; ~540 kB raw compresses to ~59 kB gzip and is cached separately
    // from app code. Set the warning limit above it to keep build output clean.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Split the large static matrix data (all per-engine JSON) and the
        // React runtime into their own long-term-cacheable chunks so the main
        // app chunk stays small and app-code changes don't bust the data cache.
        manualChunks(id) {
          if (id.includes('/src/data/')) return 'matrix-data';
          if (id.includes('node_modules/react')) return 'react-vendor';
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    css: true,
    // The App tests render the whole matrix (30+ platforms, ~100 rows) and some
    // click through it, so a single test uses ~2s on a laptop. The 5s default
    // left too little headroom for a slower CI runner: the same tests timed out
    // there. This is only an upper bound, so fast runs are unaffected.
    testTimeout: 30000,

  },
})
