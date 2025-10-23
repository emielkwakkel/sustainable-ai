import { vi } from 'vitest'

// Mock Vue composables
const ref = vi.fn((val) => ({ value: val }))
const computed = vi.fn((fn) => ({ value: fn() }))
const readonly = vi.fn((val) => val)

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
  ref,
  computed,
  readonly,
  watch: vi.fn(),
  onMounted: vi.fn(),
  onUnmounted: vi.fn()
}))

// Make ref and computed available globally
;(global as any).ref = ref
;(global as any).computed = computed
;(global as any).readonly = readonly

// Mock import.meta.client
// Object.defineProperty(import.meta, 'client', {
//   value: true,
//   writable: true
// })

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
