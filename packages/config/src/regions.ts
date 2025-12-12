import type { AvailableRegion } from '@susai/types'
import { grids } from './data/grids'

/**
 * Available regions for WattTime carbon intensity monitoring.
 * Derived from grids data, providing code and name only (no description).
 */
export const availableRegions: AvailableRegion[] = grids.map(grid => ({
  code: grid.code,
  name: grid.name
}))

