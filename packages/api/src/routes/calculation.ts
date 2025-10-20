import { Router } from 'express'
import { sustainableAICalculator } from '@susai/core'
import type { 
  TokenCalculatorFormData, 
  CalculationResult, 
  ApiResponse,
  FormValidationResult 
} from '@susai/types'

const router = Router()

interface CalculationRequest {
  formData: TokenCalculatorFormData
}

interface CalculationResponse {
  result: CalculationResult
  validation: FormValidationResult
}

// POST /api/calculation/calculate
router.post('/calculate', (req, res) => {
  try {
    const { formData }: CalculationRequest = req.body

    if (!formData) {
      return res.status(400).json({
        success: false,
        error: 'Missing form data'
      } as ApiResponse<never>)
    }

    // Validate the form data
    const validation = sustainableAICalculator.validateParams({
      tokenCount: formData.tokenCount,
      model: { id: formData.model, name: '', parameters: 0, contextLength: formData.contextLength, contextWindow: formData.contextWindow, complexityFactor: 1 },
      hardware: { id: formData.hardware, name: '', powerConsumption: 0, tokensPerSecond: 0, efficiency: 0 },
      dataCenter: { id: formData.dataCenterRegion, name: '', region: '', pue: 1, carbonIntensity: 0.415 },
      customPue: formData.customPue,
      customCarbonIntensity: formData.customCarbonIntensity,
      contextWindow: formData.contextWindow
    })

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        data: { validation }
      } as ApiResponse<{ validation: FormValidationResult }>)
    }

    // Calculate emissions
    const result = sustainableAICalculator.calculateFromFormData(formData)

    const response: ApiResponse<CalculationResponse> = {
      success: true,
      data: {
        result,
        validation
      }
    }

    res.json(response)
  } catch (error) {
    console.error('Calculation error:', error)
    res.status(500).json({
      success: false,
      error: 'Calculation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<never>)
  }
})

// GET /api/calculation/validate
router.post('/validate', (req, res) => {
  try {
    const { formData }: CalculationRequest = req.body

    if (!formData) {
      return res.status(400).json({
        success: false,
        error: 'Missing form data'
      } as ApiResponse<never>)
    }

    const validation = sustainableAICalculator.validateParams({
      tokenCount: formData.tokenCount,
      model: { id: formData.model, name: '', parameters: 0, contextLength: formData.contextLength, contextWindow: formData.contextWindow, complexityFactor: 1 },
      hardware: { id: formData.hardware, name: '', powerConsumption: 0, tokensPerSecond: 0, efficiency: 0 },
      dataCenter: { id: formData.dataCenterRegion, name: '', region: '', pue: 1, carbonIntensity: 0.415 },
      customPue: formData.customPue,
      customCarbonIntensity: formData.customCarbonIntensity,
      contextWindow: formData.contextWindow
    })

    const response: ApiResponse<FormValidationResult> = {
      success: true,
      data: validation
    }

    res.json(response)
  } catch (error) {
    console.error('Validation error:', error)
    res.status(500).json({
      success: false,
      error: 'Validation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<never>)
  }
})

export { router as calculationRoutes }
