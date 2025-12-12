---
name: Fix display bugs in projects pages
overview: "Fix three display bugs: show model names instead of IDs in preset displays, format token numbers with dots for readability, and use automatic unit conversion for CO2 and energy in project cards."
todos:
  - id: create-model-helper
    content: Create helper function/composable to fetch models and get model name by ID in projects/[id].vue
    status: completed
  - id: update-preset-display
    content: Replace model ID with model name in preset configuration section and preset selection modal
    status: completed
    dependencies:
      - create-model-helper
  - id: add-number-formatting
    content: Add formatNumberWithDots function to utils/formatting.ts for European-style number formatting
    status: completed
  - id: update-token-formatting
    content: Update ProjectSummary.vue to use formatNumberWithDots for totalTokens display
    status: completed
    dependencies:
      - add-number-formatting
  - id: update-co2-energy-formatting
    content: Replace manual formatting in projects/index.vue with formatCO2 and formatEnergyWh functions
    status: completed
---

# Fix Display Bugs in Projects Pages

## Overview

Fix three display bugs across the projects pages:

1. Display model names instead of IDs in preset configuration displays
2. Format token numbers with dots (European style: 156.000.123)
3. Use automatic unit conversion for CO2 and energy in project cards

## Implementation Plan

### 1. Create Model Name Helper Function

- **File**: `apps/dashboard/pages/projects/[id].vue`
- Create a composable or helper function to fetch models and get model name by ID
- Use `fetchAIModels()` from `@susai/config` or create a `useModels` composable similar to `useTokenCalculator`
- Add a computed property or helper function `getModelName(modelId: string)` that looks up the model name

### 2. Update Preset Display to Show Model Names

- **File**: `apps/dashboard/pages/projects/[id].vue`
- Replace `{{ currentPreset.configuration.model }}` with `{{ getModelName(currentPreset.configuration.model) }}` in the preset configuration section (line 37)
- Replace `{{ preset.configuration.model }}` with `{{ getModelName(preset.configuration.model) }}` in the preset selection modal (line 154)
- Initialize models on component mount to ensure model names are available

### 3. Add Number Formatting with Dots

- **File**: `apps/dashboard/utils/formatting.ts`
- Add new function `formatNumberWithDots(value: number): string` that formats numbers with dots as thousand separators (e.g., 156000123 → "156.000.123")
- Use `toLocaleString('de-DE')` or manual formatting with dots

### 4. Update Token Display Formatting

- **File**: `apps/dashboard/components/projects/ProjectSummary.vue`
- Replace `{{ totalTokens }}` (line 38) with `{{ formatNumberWithDots(totalTokens) }}`
- Import the new formatting function from `~/utils/formatting`

### 5. Update CO2 and Energy Formatting in Project Cards

- **File**: `apps/dashboard/pages/projects/index.vue`
- Replace manual formatting for CO2 (line 59) with `formatCO2()` from `~/utils/formatting`
- Replace manual formatting for energy (line 69) with `formatEnergyWh()` from `~/utils/formatting`
- Remove the local `formatNumber` function if it's no longer needed
- Import `formatCO2` and `formatEnergyWh` from `~/utils/formatting`

## Files to Modify

1. `apps/dashboard/pages/projects/[id].vue` - Add model name lookup and update preset displays
2. `apps/dashboard/utils/formatting.ts` - Add `formatNumberWithDots` function
3. `apps/dashboard/components/projects/ProjectSummary.vue` - Update token formatting
4. `apps/dashboard/pages/projects/index.vue` - Update CO2 and energy formatting

## Technical Details

### Model Name Lookup

- Models are stored as UUIDs in `preset.configuration.model`
- Need to fetch models from API and create a lookup map
- Can reuse `useTokenCalculator` composable's `aiModels` or create a dedicated `useModels` composable

### Number Formatting

- European style uses dots as thousand separators
- Example: `156000123` → `"156.000.123"`
- Can use `toLocaleString('de-DE')` or manual formatting

### Unit Conversion

- `formatCO2()` already handles: mg → g → kg → t conversion
- `formatEnergyWh()` already handles: Wh → kWh → MWh → GWh conversion
- Both functions are in `apps/dashboard/utils/formatting.ts` and ready to use