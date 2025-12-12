---
name: Remove Context Length from Calculations
overview: Remove `contextLength` from all calculation-related code, keeping it only in model definitions for validation. Presets will only store `contextWindow`, and calculations will no longer store or use `context_length`.
todos:
  - id: "1"
    content: Create database migration to remove context_length column from calculations table
    status: completed
  - id: "2"
    content: Update preset migration to remove contextLength from preset configurations
    status: completed
  - id: "3"
    content: "Update type definitions: remove contextLength from TokenCalculatorFormData and Calculation types"
    status: completed
  - id: "4"
    content: Update preset API routes to remove contextLength validation and from responses
    status: completed
  - id: "5"
    content: Update calculation API routes to remove context_length from queries, inserts, updates, and responses
    status: completed
  - id: "6"
    content: Update import routes (cursor-import, csv-import) to remove contextLength references
    status: completed
  - id: "7"
    content: Remove Context Length input field and logic from EditCalculationModal.vue
    status: completed
  - id: "8"
    content: Remove contextLength from AddCalculationModal.vue form data and watch logic
    status: completed
  - id: "9"
    content: Remove contextLength references from TokenCalculatorForm.vue
    status: completed
  - id: "10"
    content: Remove contextLength from calculator.vue page form data and validation
    status: completed
  - id: "11"
    content: Verify core package validation still uses model.contextLength correctly
    status: completed
---

# Remove Context Length from Calculations

## Overview

Remove `contextLength` from all calculation forms, database schema, and API responses. Keep `contextLength` only in model definitions (`ai_models` table) for validation purposes (to validate that `contextWindow` doesn't exceed the model's maximum capacity).

## Changes Required

### 1. Database Schema Changes

**File**: Create new migration `packages/api/src/migrations/028_remove_context_length_from_calculations.sql`

- Remove `context_length` column from `calculations` table
- Update any views or queries that reference `context_length`

**File**: `packages/api/src/migrations/027_migrate_hardcoded_presets.sql`

- Remove `contextLength` from preset configurations (lines 18, 39)
- Presets should only store `contextWindow`

### 2. Type Definitions

**File**: `packages/types/src/index.ts`

- Remove `contextLength` from `TokenCalculatorFormData` interface (line 202)
- Keep `contextLength` in `CreateModelRequest` and `UpdateModelRequest` (model definitions)
- Remove `contextLength` from `Calculation` type if present

**File**: `apps/dashboard/types/watttime.ts`

- Remove `context_length` from `Calculation` interface (line 326)

### 3. API Routes - Presets

**File**: `packages/api/src/routes/presets.ts`

- Remove `contextLength` validation from create/update endpoints (lines 120, 216)
- Only validate `model` and `contextWindow` are present
- Remove `contextLength` from preset configuration responses

### 4. API Routes - Calculations

**File**: `packages/api/src/routes/calculations.ts`

- Remove `context_length` from SELECT queries (lines 137, 292)
- Remove `context_length` from INSERT/UPDATE operations (lines 433, 451, 540-543, 549)
- Remove `context_length` from calculation responses (lines 346, 689, 819)
- Use only `contextWindow` from presets, get `contextLength` from model for validation

**File**: `packages/api/src/routes/cursor-import.ts`

- Remove `contextLength` from preset usage (line 288)
- Remove `context_length` from calculation creation (line 316)

**File**: `packages/api/src/routes/csv-import.ts`

- Remove `contextLength` from preset usage (line 146)
- Remove `context_length` from calculation creation (line 174)

**File**: `packages/api/src/routes/projects.ts`

- Remove `context_length` from calculation responses (line 436)

### 5. UI Components - Calculation Forms

**File**: `apps/dashboard/components/projects/EditCalculationModal.vue`

- Remove "Context Length" input field (lines 161-174)
- Remove `context_length` from `formData` (line 248)
- Remove `projectPresetContextLength` computed (lines 313-315)
- Remove `context_length` from preset matching logic (lines 338-339, 349-350, 356, 372, 387)
- Remove `context_length` from form initialization (line 426)
- Remove `context_length` from preset change handler (lines 472, 479)
- Remove `context_length` from save payload (lines 538, 540, 543, 549)
- Update preset display to only show `contextWindow` (line 154)

**File**: `apps/dashboard/components/projects/AddCalculationModal.vue`

- Remove `contextLength` from `calculatorFormData` (lines 103, 120, 134, 170, 180, 226, 256, 295)
- Remove `contextLength` watch logic (lines 175-182, 185-191)
- Keep validation that uses model's `contextLength` for `contextWindow` validation

**File**: `apps/dashboard/components/token-calculator/TokenCalculatorForm.vue`

- Remove `selectedModelContextLength` computed (lines 371-374)
- Remove `contextLength` references from validation (lines 154, 160-161)
- Keep validation that uses model's `contextLength` for `contextWindow` max validation

**File**: `apps/dashboard/pages/calculator.vue`

- Remove `contextLength` from `formData` (line 88)
- Remove `selectedModelContextLength` computed (lines 107-111)
- Remove `contextLength` watch logic (lines 238, 243, 248-249, 254-255)
- Keep validation that uses model's `contextLength` for `contextWindow` validation

### 6. Core Package - Validation

**File**: `packages/core/src/index.ts`

- Keep `model.contextLength` validation (lines 174-187)
- This validates that `contextWindow` doesn't exceed model's maximum capacity
- Remove any references to `params.contextLength` if present (should only use `params.contextWindow`)

### 7. Model Management (Keep Context Length)

**File**: `apps/dashboard/components/ModelFormModal.vue`

- **KEEP** "Context Length" input field (lines 53-60)
- This is for model definitions, not calculations
- `contextLength` defines the model's maximum capacity

**File**: `packages/api/src/routes/models.ts`

- **KEEP** `contextLength` in model CRUD operations
- This is stored in `ai_models` table for validation

### 8. Migration Data Cleanup

**File**: `packages/api/src/migrations/018_update_calculations_to_use_preset_values.sql`

- This migration can remain as-is (historical), but future calculations won't have `context_length`

## Validation Logic

The validation flow should be:

1. User selects a model (which has `contextLength` = maximum capacity)
2. User enters `contextWindow` (actual context being processed)
3. Validation checks: `contextWindow <= model.contextLength`
4. Calculation uses only `contextWindow` (not `contextLength`)

## Testing Considerations

- Verify calculations work without `context_length`
- Verify preset creation/update works without `contextLength` in configuration
- Verify validation still works (contextWindow <= model.contextLength)
- Verify existing calculations with `context_length` still load (migration handles this)