import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@susai/types': resolve(__dirname, '../types/src/index.ts'),
      '@susai/config': resolve(__dirname, '../config/src/index.ts'),
      '@susai/core': resolve(__dirname, '../core/src/index.ts'),
    }
  }
})
