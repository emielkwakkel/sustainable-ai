import { describe, it, expect } from 'vitest'
import { sustainableAICalculator } from './index'
import type { AIModel, CalculationParams } from '@susai/types'
import { getHardwareConfigById, getDataCenterRegionById } from '@susai/config'

describe('sustainableAICalculator', () => {
  it('should be defined', () => {
    expect(sustainableAICalculator).toBeDefined()
  })

  it('should have calculateFromFormData method', () => {
    expect(sustainableAICalculator.calculateFromFormData).toBeDefined()
    expect(typeof sustainableAICalculator.calculateFromFormData).toBe('function')
  })

  it('should calculate emissions for basic form data', () => {
    // Create mock GPT-4 model
    const gpt4Model: AIModel = {
      id: 'gpt-4',
      name: 'GPT-4',
      parameters: 280,
      contextLength: 8000,
      complexityFactor: 280 / 175.0
    }

    const hardware = getHardwareConfigById('nvidia-a100')!
    const dataCenter = getDataCenterRegionById('google-cloud', 'google-oregon')!

    const params: CalculationParams = {
      tokenCount: 1000,
      model: gpt4Model,
      hardware,
      dataCenter,
      contextWindow: 1250
    }

    const result = sustainableAICalculator.calculateEmissions(params)

    expect(result).toBeDefined()
    expect(result.energyJoules).toBeGreaterThan(0)
    expect(result.energyKWh).toBeGreaterThan(0)
    expect(result.carbonEmissionsGrams).toBeGreaterThan(0)
    expect(result.totalEmissionsGrams).toBeGreaterThan(0)
  })

  describe('active processing window for context adjustment', () => {
    // Mock Composer-1 model
    const composer1Model: AIModel = {
      id: 'composer-1',
      name: 'Composer 1',
      parameters: 100,
      contextLength: 200000,
      complexityFactor: 100 / 175.0,
      tokenWeights: {
        inputWithCache: 1.25,
        inputWithoutCache: 1.00,
        cacheRead: 0.001,
        outputTokens: 5.00
      }
    }

    const hardware = getHardwareConfigById('nvidia-a100')!
    const dataCenter = getDataCenterRegionById('google-cloud', 'google-oregon')!

    it('should skip context window adjustment when using weighted tokens', () => {
      const params: CalculationParams = {
        tokenCount: 1000, // Not used when detailed tokens provided
        model: composer1Model,
        hardware,
        dataCenter,
        contextWindow: 150000, // Large context window - should be ignored
        inputWithoutCache: 29839,
        cacheRead: 246016,
        outputTokens: 9054
      }

      const result = sustainableAICalculator.calculateEmissions(params)

      // Verify that results are realistic (not 2.41 t CO₂ or 6.25 GWh)
      // Context adjustment should be skipped entirely when using weighted tokens
      // Weighted tokens already account for processing complexity
      expect(result.energyKWh).toBeLessThan(100) // Should be realistic, not 6.25 GWh
      expect(result.totalEmissionsGrams).toBeLessThan(100000) // Should be realistic, not 2.41 t CO₂
      expect(result.weightedTokens).toBeDefined()
      
      // Verify context window doesn't affect the result when using weighted tokens
      // Calculate what result would be WITH context adjustment
      const baseEnergyPerTokenKwh = (hardware.powerConsumption / 1000) / hardware.tokensPerSecond
      const complexityAdjusted = baseEnergyPerTokenKwh * composer1Model.complexityFactor
      const contextFactor = Math.pow(150000 / 2048, 2) // Large context factor
      const energyWithContextAdjustment = complexityAdjusted * contextFactor * dataCenter.pue * result.weightedTokens!
      
      // Result should be much lower than what context adjustment would produce
      expect(result.energyKWh).toBeLessThan(energyWithContextAdjustment / 10)
    })

    it('should not apply context adjustment regardless of cache read size', () => {
      const params: CalculationParams = {
        tokenCount: 1000,
        model: composer1Model,
        hardware,
        dataCenter,
        contextWindow: 150000, // Large context window
        inputWithoutCache: 1000,
        cacheRead: 100000, // Large cache read
        outputTokens: 500
      }

      const result1 = sustainableAICalculator.calculateEmissions(params)

      // Same calculation but with cache reads removed
      const params2: CalculationParams = {
        tokenCount: 1000,
        model: composer1Model,
        hardware,
        dataCenter,
        contextWindow: 150000, // Same large context window
        inputWithoutCache: 1000,
        cacheRead: 0, // No cache reads
        outputTokens: 500
      }

      const result2 = sustainableAICalculator.calculateEmissions(params2)

      // Results should differ only by weighted token count difference
      // Cache reads have minimal weight (0.001), so difference should be small
      // Context adjustment is skipped for both, so context window size doesn't matter
      const energyDiff = Math.abs(result1.energyKWh - result2.energyKWh) / result2.energyKWh
      expect(energyDiff).toBeLessThan(0.05) // Less than 5% difference (cache reads have minimal weight)
      
      // Both should be realistic (not inflated by context adjustment)
      expect(result1.energyKWh).toBeLessThan(100)
      expect(result2.energyKWh).toBeLessThan(100)
    })

    it('should skip context adjustment even when active window is small', () => {
      const params: CalculationParams = {
        tokenCount: 1000,
        model: composer1Model,
        hardware,
        dataCenter,
        contextWindow: 5000, // Context window - should be ignored
        inputWithoutCache: 50,
        cacheRead: 1000,
        outputTokens: 30
      }

      const result = sustainableAICalculator.calculateEmissions(params)

      // Context adjustment should be skipped when using weighted tokens
      // regardless of context window size or active window size
      expect(result.energyKWh).toBeGreaterThan(0)
      expect(result.totalEmissionsGrams).toBeGreaterThan(0)
      expect(result.weightedTokens).toBeDefined()
      
      // Result should be based on weighted tokens, not context window
      expect(result.energyKWh).toBeLessThan(10) // Realistic value
    })

    it('should use provided contextWindow when detailed tokens not provided', () => {
      const params: CalculationParams = {
        tokenCount: 1000,
        model: composer1Model,
        hardware,
        dataCenter,
        contextWindow: 1250
        // No detailed token breakdown
      }

      const result = sustainableAICalculator.calculateEmissions(params)

      // Should use provided contextWindow (1250) as fallback
      expect(result.energyKWh).toBeGreaterThan(0)
      expect(result.totalEmissionsGrams).toBeGreaterThan(0)
      expect(result.weightedTokens).toBeUndefined()
    })

    it('should calculate correct weighted tokens and skip context adjustment', () => {
      const params: CalculationParams = {
        tokenCount: 1000,
        model: composer1Model,
        hardware,
        dataCenter,
        contextWindow: 150000, // Should be ignored
        inputWithCache: 1000,
        inputWithoutCache: 2000,
        cacheRead: 50000,
        outputTokens: 500
      }

      const result = sustainableAICalculator.calculateEmissions(params)

      // Verify weighted tokens calculation
      const expectedWeightedTokens = 
        1.25 * 1000 + // inputWithCache
        1.00 * 2000 + // inputWithoutCache
        0.001 * 50000 + // cacheRead (minimal weight)
        5.00 * 500 // outputTokens

      expect(result.weightedTokens).toBeCloseTo(expectedWeightedTokens, 1)
      
      // Energy should be based on weighted tokens, NOT context window adjustment
      // Context adjustment is skipped when using weighted tokens
      expect(result.energyKWh).toBeLessThan(10) // Realistic value
      
      // Verify that context window doesn't affect result
      // Calculate what it would be with context adjustment
      const baseEnergyPerTokenKwh = (hardware.powerConsumption / 1000) / hardware.tokensPerSecond
      const complexityAdjusted = baseEnergyPerTokenKwh * composer1Model.complexityFactor
      const contextFactor = Math.pow(150000 / 2048, 2)
      const energyWithContextAdjustment = complexityAdjusted * contextFactor * dataCenter.pue * result.weightedTokens!
      
      // Our result should be much lower (no context adjustment)
      expect(result.energyKWh).toBeLessThan(energyWithContextAdjustment / 100)
    })
  })
})
