import { vi } from 'vitest'

// Mock Nuxt composables
vi.mock('#app', () => ({
  useRuntimeConfig: () => ({
    public: {
      wattTimeApiUrl: 'https://api.watttime.org'
    }
  }),
  $fetch: vi.fn(),
  useHead: vi.fn(),
  useState: vi.fn(() => ref(false)),
  ref: vi.fn((val) => ({ value: val })),
  computed: vi.fn((fn) => ({ value: fn() })),
  watch: vi.fn(),
  onMounted: vi.fn(),
  onUnmounted: vi.fn()
}))

// Mock useTokenManager
vi.mock('~/composables/useTokenManager', () => ({
  useTokenManager: () => ({
    getTokenInfo: vi.fn(() => ({
      token: 'test-token',
      isValid: true
    })),
    connectionStatus: ref({ connected: true })
  })
}))

// Mock import.meta.client
Object.defineProperty(import.meta, 'client', {
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
