<!-- fc4276c7-ea11-4a60-92ea-979c0a8d73a5 74b69f38-3981-478f-9be6-6a8ac78aca12 -->
# Model Manager System

## Overview

Replace hardcoded models in `packages/config/src/models.ts` with a database-backed system that supports CRUD operations through API endpoints and a dashboard UI. Models will have optional tokenWeights, auto-calculated complexityFactor, and optional pricing.

## Implementation Plan

### 1. Database Schema

- Create migration `021_create_ai_models_table.sql`:
- Table: `ai_models`
- Columns: `id` (UUID), `name` (VARCHAR), `parameters` (INTEGER, billions), `context_length` (INTEGER), `context_window` (INTEGER), `token_weights` (JSONB, nullable), `complexity_factor` (DECIMAL, auto-calculated), `pricing` (JSONB, nullable with `input`, `cachedInput`, `output`), `is_system` (BOOLEAN, default false), `created_at`, `updated_at`
- Index on `id` and `name`
- Auto-calculate `complexity_factor` as `parameters / 175.0` (GPT-3 baseline)

### 2. Migration Script

- Create migration `022_migrate_hardcoded_models.sql`:
- Insert all models from `packages/config/src/models.ts` into `ai_models` table
- Mark existing models as `is_system = true`
- Migrate pricing from `packages/config/src/pricing.ts` to model `pricing` JSONB field

### 3. API Routes

- Create `packages/api/src/routes/models.ts`:
- `GET /api/models` - List all models
- `GET /api/models/:id` - Get model by ID
- `POST /api/models` - Create new model (validate required fields, auto-calculate complexityFactor)
- `PUT /api/models/:id` - Update model (prevent updating system models if needed)
- `DELETE /api/models/:id` - Delete model (prevent deleting system models)
- Register routes in `packages/api/src/index.ts`

### 4. Update Config Package

- Modify `packages/config/src/models.ts`:
- Remove hardcoded `aiModels` array
- Create `fetchAIModels()` function that calls API endpoint
- Update `getAIModelById()` to use API
- Keep fallback to hardcoded models for backward compatibility during transition
- Update `packages/config/src/pricing.ts`:
- Remove hardcoded `modelPricing` array
- Create `fetchModelPricing()` that extracts pricing from models API
- Update `getPricingForModel()` to use API

### 5. Dashboard Model Manager Page

- Create `apps/dashboard/pages/models.vue`:
- Table/list view of all models with columns: Name, Parameters, Context Length/Window, Complexity Factor, Has Pricing, Actions
- Add button to create new model
- Edit button for each model (opens modal)
- Delete button (disabled for system models)
- Form fields: name, parameters, context_length, context_window, tokenWeights (optional, with defaults), pricing (optional: input, cachedInput, output)
- Auto-calculate and display complexityFactor as `parameters / 175`
- Validation for required fields

### 6. Update TokenSimulatorSummary

- Modify `apps/dashboard/components/token-simulator/TokenSimulatorSummary.vue`:
- Fetch models from API instead of hardcoded list
- Filter models that have pricing defined
- Display models with pricing in the summary
- Support custom costs (existing functionality remains)

### 7. Update Core Package

- Modify `packages/core/src/index.ts`:
- Update `calculateFromFormData()` to fetch model from API if needed
- Ensure compatibility with both API and config-based models during transition

### 8. Update Other Components

- Update `apps/dashboard/pages/calculator.vue`:
- Fetch models from API for dropdown
- Update `apps/dashboard/composables/useTokenCalculator.ts`:
- Update to use API-based models
- Update `packages/api/src/routes/config.ts`:
- Change `/api/config/models` to fetch from database instead of hardcoded

### 9. Type Updates

- Update `packages/types/src/index.ts`:
- Add `ModelPricing` fields to `AIModel` interface (optional)
- Add `isSystem` field to `AIModel` interface
- Add API request/response types for model CRUD operations

## Files to Modify

- `packages/api/src/migrations/021_create_ai_models_table.sql` (new)
- `packages/api/src/migrations/022_migrate_hardcoded_models.sql` (new)
- `packages/api/src/routes/models.ts` (new)
- `packages/api/src/index.ts` (add route registration)
- `packages/config/src/models.ts` (refactor to use API)
- `packages/config/src/pricing.ts` (refactor to use API)
- `packages/types/src/index.ts` (add types)
- `apps/dashboard/pages/models.vue` (new)
- `apps/dashboard/components/token-simulator/TokenSimulatorSummary.vue` (update)
- `apps/dashboard/pages/calculator.vue` (update)
- `apps/dashboard/composables/useTokenCalculator.ts` (update)
- `packages/api/src/routes/config.ts` (update)
- `packages/core/src/index.ts` (update if needed)

## Migration Strategy

1. Create database schema
2. Migrate existing models to database
3. Update API to serve from database
4. Update config package to fetch from API (with fallback)
5. Update dashboard components gradually
6. Remove hardcoded fallbacks after verification

### To-dos

- [ ] Create database migration for ai_models table with all required fields including pricing JSONB and auto-calculated complexity_factor
- [ ] Create migration script to move hardcoded models from models.ts and pricing.ts to database, marking them as system models
- [ ] Create CRUD API routes in packages/api/src/routes/models.ts with validation and system model protection
- [ ] Update AIModel interface in types package to include pricing and isSystem fields, add API request/response types
- [ ] Refactor models.ts and pricing.ts to fetch from API instead of hardcoded arrays, with fallback for backward compatibility
- [ ] Create models.vue page with table view, add/edit/delete functionality, form validation, and auto-calculation of complexityFactor
- [ ] Update TokenSimulatorSummary.vue to fetch models from API and display models with pricing
- [ ] Update calculator.vue and useTokenCalculator.ts to use API-based models
- [ ] Update /api/config/models route to fetch from database instead of hardcoded config