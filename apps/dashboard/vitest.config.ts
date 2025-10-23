import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts']
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, '.'),
      '@': resolve(__dirname, '.'),
      '@susai/types': fileURLToPath(new URL("../../packages/types/src/index.ts", import.meta.url)),
      '@susai/config': fileURLToPath(new URL("../../packages/config/src/index.ts", import.meta.url)),
      '@susai/core': fileURLToPath(new URL("../../packages/core/src/index.ts", import.meta.url)),
      '@susai/api': fileURLToPath(new URL("../../packages/api/src/index.ts", import.meta.url)),
      '@susai/cli': fileURLToPath(new URL("../../packages/cli/src/index.ts", import.meta.url)),
    }
  }
})
