<!-- a561e367-3f14-4491-95ed-c25f7f33930d cc281b58-c3ef-42a0-af28-e39e16507127 -->
# Token Calculation Improvements with Cache Differentiation

## Overview

Enhance the token calculation system to differentiate between input/output tokens with and without cache write, add new models (Sonnet 4.5, Composer 1), migrate database schema, and update the calculator UI to support weighted token calculations.

## Implementation Plan

### 1. Add New Models to models.ts

- Add 'sonnet-4.5' and 'composer-1' models to `packages/config/src/models.ts`
- Include token weight multipliers for each model:
  - Input (w/ Cache Write): 1.25
  - Input (w/o Cache Write): 1.00
  - Cache Read: 0.10
  - Output Tokens: 5.00
- Extend AIModel interface in `packages/types/src/index.ts` to include token weights

### 2. Database Migration: Update Model Values

- Create migration `019_update_auto_model_to_sonnet.sql`
- Update all calculations where `model = 'Auto'` to `model = 'sonnet-4.5'`

### 3. Database Migration: Split calculation_parameters JSONB

- Create migration `020_split_calculation_parameters.sql`
- Add new columns to `calculations` table:
  - `cache_read INTEGER`
  - `output_tokens INTEGER`
  - `input_with_cache INTEGER`
  - `input_without_cache INTEGER`
- Migrate existing data from `calculation_parameters` JSONB:
  - Extract `cacheRead` → `cache_read`
  - Extract `outputTokens` → `output_tokens`
  - Extract `inputWithCache` → `input_with_cache`
  - Extract `inputWithoutCache` → `input_without_cache`
- Keep `calculation_parameters` JSONB column temporarily for backward compatibility
- Update all API routes that read/write `calculation_parameters`

### 4. Update Type Definitions

- Extend `TokenCalculatorFormData` in `packages/types/src/index.ts`:
  - Add optional fields: `inputWithCache`, `inputWithoutCache`, `cacheRead`, `outputTokens`
  - Add `useDetailedTokens` boolean flag
  - Add optional `tokenWeights` override object
- Update `Calculation` interface in `apps/dashboard/types/watttime.ts` to match new schema
- Update `AIModel` interface to include `tokenWeights` property

### 5. Update Core Calculation Engine

- Modify `packages/core/src/index.ts`:
  - Add weighted token calculation method using formula:
    ```
    weighted_tokens = 
      1.25 * inputWithCache +
      1.00 * inputWithoutCache +
      0.10 * cacheRead +
      5.00 * outputTokens
    ```

  - Update `calculateEmissions` to accept either `tokenCount` or detailed token breakdown
  - Use model-specific token weights (with override support)
  - Calculate weighted tokens when detailed fields are provided

### 6. Update API Routes

- Modify `packages/api/src/routes/calculations.ts`:
  - Update INSERT queries to include new columns
  - Update SELECT queries to return new columns
  - Update UPDATE queries to handle new columns
- Modify `packages/api/src/routes/cursor-import.ts`:
  - Map Cursor API data to new column structure
  - Extract `cacheRead`, `outputTokens`, `inputWithCache`, `inputWithoutCache` from records
- Modify `packages/api/src/routes/csv-import.ts`:
  - Update CSV import to populate new columns

### 7. Update Token Calculator UI

- Modify `apps/dashboard/components/AddCalculationModal.vue`:
  - Add toggle/radio for "Total Tokens" vs "Detailed Tokens" mode
  - When detailed mode selected, show fields:
    - Input (w/ Cache Write)
    - Input (w/o Cache Write)
    - Cache Read
    - Output Tokens
  - Display model-specific token weights (read-only, with override option)
  - Calculate and display weighted token count
  - Update form validation for new fields
- Modify `apps/dashboard/pages/calculator.vue`:
  - Add similar UI controls for detailed token input
  - Display token weights per selected model

### 8. Update Composables

- Modify `apps/dashboard/composables/useTokenCalculator.ts`:
  - Add validation for detailed token fields
  - Add method to calculate weighted tokens
  - Update `calculateEmissions` to handle both modes

### 9. Update Tests

- Update `apps/dashboard/tests/composables/useTokenCalculator.test.ts`:
  - Add tests for weighted token calculation
  - Add tests for detailed token mode
  - Add tests for token weight overrides

## Files to Modify

### Core Changes

- `packages/config/src/models.ts` - Add new models with token weights
- `packages/types/src/index.ts` - Extend interfaces
- `packages/core/src/index.ts` - Add weighted token calculation

### Database Migrations

- `packages/api/src/migrations/019_update_auto_model_to_sonnet.sql` - New
- `packages/api/src/migrations/020_split_calculation_parameters.sql` - New

### API Routes

- `packages/api/src/routes/calculations.ts` - Update queries
- `packages/api/src/routes/cursor-import.ts` - Update data mapping
- `packages/api/src/routes/csv-import.ts` - Update CSV import

### Frontend

- `apps/dashboard/components/AddCalculationModal.vue` - Add detailed token UI
- `apps/dashboard/pages/calculator.vue` - Add detailed token UI
- `apps/dashboard/composables/useTokenCalculator.ts` - Add weighted calculation
- `apps/dashboard/types/watttime.ts` - Update interfaces

### Tests

- `apps/dashboard/tests/composables/useTokenCalculator.test.ts` - Add new tests

### To-dos

- [x] Add Sonnet 4.5 and Composer 1 models to models.ts with token weights
- [x] Extend AIModel and TokenCalculatorFormData interfaces with token weights and detailed fields
- [x] Create migration to update 'Auto' model to 'sonnet-4.5'
- [x] Create migration to split calculation_parameters JSONB into separate columns
- [x] Update core calculation engine to support weighted token calculation
- [x] Update API routes to use new column structure
- [x] Update cursor-import route to populate new columns
- [x] Update csv-import route to populate new columns
- [x] Add detailed token input mode to AddCalculationModal and calculator page
- [x] Update useTokenCalculator composable with weighted token calculation
- [x] Add tests for weighted token calculation and detailed token mode