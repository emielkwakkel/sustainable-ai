import { vi } from 'vitest'

// Mock Nuxt composables
vi.mock('#app', () => ({
  useRuntimeConfig: () => ({
    public: {
      wattTimeApiUrl: 'https://api.watttime.org'
    }
  }),
  $fetch: vi.fn()
}))

// Mock process.client
Object.defineProperty(process, 'client', {
  value: true,
  writable: true
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock document for dark mode
Object.defineProperty(document, 'documentElement', {
  value: {
    classList: {
      add: vi.fn(),
      remove: vi.fn()
    }
  },
  writable: true
})
