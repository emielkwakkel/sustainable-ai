import { Router } from 'express'
import { sustainableAICalculator } from '@susai/core'
import type { 
  TokenCalculatorFormData, 
  CalculationResult, 
  ApiResponse,
  FormValidationResult
} from '@susai/types'
import { getHardwareConfigById, getDataCenterRegionById } from '@susai/config'
import { fetchModelFromDB } from '../services/modelService'

const router = Router()

interface CalculationRequest {
  formData: TokenCalculatorFormData
}

interface CalculationResponse {
  result: CalculationResult
  validation: FormValidationResult
}

// POST /api/calculation/calculate
router.post('/calculate', async (req, res) => {
  try {
    const { formData }: CalculationRequest = req.body

    if (!formData) {
      return res.status(400).json({
        success: false,
        error: 'Missing form data'
      } as ApiResponse<never>)
    }

    // Fetch model from database
    const model = await fetchModelFromDB(formData.model)
    if (!model) {
      return res.status(404).json({
        success: false,
        error: `Model '${formData.model}' not found`
      } as ApiResponse<never>)
    }

    const hardware = getHardwareConfigById(formData.hardware)
    const dataCenter = getDataCenterRegionById(formData.dataCenterProvider, formData.dataCenterRegion)

    if (!hardware || !dataCenter) {
      return res.status(400).json({
        success: false,
        error: 'Invalid hardware or data center configuration'
      } as ApiResponse<never>)
    }

    // Validate the form data
    const validation = sustainableAICalculator.validateParams({
      tokenCount: formData.tokenCount,
      model,
      hardware,
      dataCenter,
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
    const result = sustainableAICalculator.calculateFromFormData(formData, model)

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
router.post('/validate', async (req, res) => {
  try {
    const { formData }: CalculationRequest = req.body

    if (!formData) {
      return res.status(400).json({
        success: false,
        error: 'Missing form data'
      } as ApiResponse<never>)
    }

    // Fetch model from database
    const model = await fetchModelFromDB(formData.model)
    if (!model) {
      return res.status(404).json({
        success: false,
        error: `Model '${formData.model}' not found`
      } as ApiResponse<never>)
    }

    const hardware = getHardwareConfigById(formData.hardware)
    const dataCenter = getDataCenterRegionById(formData.dataCenterProvider, formData.dataCenterRegion)

    if (!hardware || !dataCenter) {
      return res.status(400).json({
        success: false,
        error: 'Invalid hardware or data center configuration'
      } as ApiResponse<never>)
    }

    const validation = sustainableAICalculator.validateParams({
      tokenCount: formData.tokenCount,
      model,
      hardware,
      dataCenter,
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
