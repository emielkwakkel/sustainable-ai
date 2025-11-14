import { describe, it, expect } from 'vitest'
import { 
  hardwareConfigs, 
  dataCenterProviders,
  getPueForRegion,
  getCarbonIntensityForRegion
} from './index'

describe('config', () => {
  it('should export hardwareConfigs', () => {
    expect(hardwareConfigs).toBeDefined()
    expect(Array.isArray(hardwareConfigs)).toBe(true)
    expect(hardwareConfigs.length).toBeGreaterThan(0)
  })

  it('should export dataCenterProviders', () => {
    expect(dataCenterProviders).toBeDefined()
    expect(Array.isArray(dataCenterProviders)).toBe(true)
    expect(dataCenterProviders.length).toBeGreaterThan(0)
  })

  it('should have getPueForRegion function', () => {
    expect(getPueForRegion).toBeDefined()
    expect(typeof getPueForRegion).toBe('function')
  })

  it('should have getCarbonIntensityForRegion function', () => {
    expect(getCarbonIntensityForRegion).toBeDefined()
    expect(typeof getCarbonIntensityForRegion).toBe('function')
  })

  it('should return PUE for valid region', () => {
    const pue = getPueForRegion('google-cloud', 'google-oregon')
    expect(pue).toBeGreaterThan(0)
  })

  it('should return carbon intensity for valid region', () => {
    const carbonIntensity = getCarbonIntensityForRegion('google-cloud', 'google-oregon')
    expect(carbonIntensity).toBeGreaterThan(0)
  })
})
