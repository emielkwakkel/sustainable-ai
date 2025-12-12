---
name: Database-Backed Presets Migration
overview: ""
todos:
  - id: ac497f0c-de8f-4f5e-b5f5-866ea4222551
    content: Create database migration for presets table with UUID id, name, description, configuration JSONB, user_id, is_system, timestamps
    status: completed
  - id: 64299bd3-b538-4c7d-b358-d332e8e2db7f
    content: Create migration script to insert hardcoded presets from config into database, converting model names to UUIDs
    status: completed
  - id: 77359d1b-0a18-439f-8bee-578665b255c6
    content: Create API routes for presets CRUD operations (GET, GET by id, POST, PUT, DELETE) with user_id filtering
    status: completed
  - id: 34955d30-60da-41f1-b060-dc94aceea0e8
    content: "Update TypeScript types: change TokenCalculatorFormData.model to UUID, update TokenCalculatorPreset interface, update PresetManager interface"
    status: completed
  - id: 2f40c8a6-fb88-4457-84f0-f69ee8a5d27f
    content: Remove hardcoded presets and getPresetById from config package, add deprecation warnings
    status: completed
  - id: fac3a548-e375-4e08-a63f-cef4b9cd0c01
    content: Replace getPresetById calls in calculations, cursor-import, csv-import, and projects routes with database queries
    status: completed
  - id: 6c9922d9-ccdd-4a0f-b507-5ad70eafb33f
    content: Rewrite usePresets composable to use API instead of localStorage, remove export/import functions
    status: completed
  - id: a615daa3-a9c1-4268-aa1c-270f12231f15
    content: Update PresetManager component to remove import/export UI and default/custom distinction, use API for all operations
    status: completed
  - id: aa5ff1eb-1b35-4ff8-ad71-1857410aed78
    content: Update frontend components that use presets to use API instead of local getPresetById
    status: completed
  - id: 10a75a0c-2f6d-44ab-b108-1a427b9f80ce
    content: Create migration logic to move existing localStorage presets to database on first load
    status: completed
---

# Database-Backed Presets Migration

## Overview

Move presets from hardcoded `packages/config/src/presets.ts` and localStorage to a database-backed system with full CRUD via API. Remove import/export functionality and migrate model field from string name to UUID.

## Implementation Plan

### 1. Database Schema

- Create migration `026_create_presets_table.sql`:
- Table: `presets`
- Columns: `id` (UUID, primary key), `name` (VARCHAR), `description` (TEXT), `configuration` (JSONB), `user_id` (VARCHAR, nullable for system presets), `is_system` (BOOLEAN, default false), `created_at`, `updated_at`
- Indexes: `idx_presets_user_id`, `idx_presets_is_system`
- Auto-update trigger for `updated_at`

### 2. Migration Script

- Create migration `027_migrate_hardcoded_presets.sql`:
- Insert presets from `packages/config/src/presets.ts` into `presets` table
- Mark as `is_system = true` with `user_id = NULL`
- Convert `model` field in configuration from string name to UUID by looking up model in `ai_models` table
- Handle case-insensitive model name matching

### 3. API Routes

- Create `packages/api/src/routes/presets.ts`:
- `GET /api/presets` - List all presets (filter by user_id query param, include system presets)
- `GET /api/presets/:id` - Get preset by ID
- `POST /api/presets` - Create new preset (requires user_id in body)
- `PUT /api/presets/:id` - Update preset (user can only update their own, system presets cannot be updated)
- `DELETE /api/presets/:id` - Delete preset (user can only delete their own, system presets cannot be deleted)
- Register routes in `packages/api/src/index.ts`

### 4. Update Types

- Update `packages/types/src/index.ts`:
- Change `TokenCalculatorFormData.model` from `string` to `string` (UUID)
- Update `TokenCalculatorPreset` interface: remove `isDefault`, add `isSystem`, add `userId`
- Update `PresetManager` interface: remove `defaultPresets`, `customPresets`, `exportPresets`, `importPresets`

### 5. Update Config Package

- Modify `packages/config/src/presets.ts`:
- Remove `projectPresets` array and `getPresetById` function
- Keep `ProjectPreset` interface for backward compatibility during transition
- Add deprecation warnings

### 6. Update API Routes Using Presets

- Update `packages/api/src/routes/calculations.ts`:
- Replace `getPresetById` import with database query
- Fetch preset from database instead of config
- Update `packages/api/src/routes/cursor-import.ts`:
- Replace `getPresetById` with database query
- Update `packages/api/src/routes/csv-import.ts`:
- Replace `getPresetById` with database query
- Update `packages/api/src/routes/projects.ts`:
- Replace `getPresetById` with database query

### 7. Frontend Composable

- Rewrite `apps/dashboard/composables/usePresets.ts`:
- Remove localStorage logic
- Remove default/custom preset distinction
- Replace with API calls using `$fetch`
- Remove `exportPresets` and `importPresets` functions
- Update return interface to match new `PresetManager` type

### 8. Frontend Component

- Update `apps/dashboard/components/PresetManager.vue`:
- Remove Import/Export section (lines 117-139)
- Remove "Default Presets" vs "Custom Presets" distinction
- Update preset selection to show all presets (system + user's)
- Update save/delete logic to use API
- Remove `isDefault` checks

### 9. Frontend Pages/Components Using Presets

- Update `apps/dashboard/pages/projects/[id].vue`:
- Replace local `getPresetById` with API call
- Update `apps/dashboard/components/projects/EditCalculationModal.vue`:
- Replace local `getPresetById` with API call
- Update any other components that use presets directly

### 10. Model UUID Migration

- Update `TokenCalculatorFormData` usage:
- Ensure all form components use model UUID instead of name
- Update `apps/dashboard/components/token-calculator/TokenCalculatorForm.vue` to ensure model field stores UUID
- Verify model lookups use UUID throughout

### 11. Data Migration

- Create migration script to convert existing localStorage presets:
- Read localStorage presets on first load
- Migrate to database via API
- Clear localStorage after migration
- Handle case where preset model name needs UUID lookup

## Files to Modify

- `packages/api/src/migrations/026_create_presets_table.sql` (new)
- `packages/api/src/migrations/027_migrate_hardcoded_presets.sql` (new)
- `packages/api/src/routes/presets.ts` (new)
- `packages/api/src/index.ts`
- `packages/types/src/index.ts`
- `packages/config/src/presets.ts`
- `packages/api/src/routes/calculations.ts`
- `packages/api/src/routes/cursor-import.ts`
- `packages/api/src/routes/csv-import.ts`
- `packages/api/src/routes/projects.ts`
- `apps/dashboard/composables/usePresets.ts`
- `apps/dashboard/components/PresetManager.vue`
- `apps/dashboard/pages/projects/[id].vue`
- `apps/dashboard/components/projects/EditCalculationModal.vue`