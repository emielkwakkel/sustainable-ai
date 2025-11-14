/**
 * Check if code is running in a browser environment
 */
export function isBrowser(): boolean {
  return typeof globalThis !== 'undefined' && 
    (globalThis as any).window !== undefined &&
    typeof (globalThis as any).fetch !== 'undefined'
}

