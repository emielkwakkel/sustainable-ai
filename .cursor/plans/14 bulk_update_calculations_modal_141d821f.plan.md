# Bulk Update Calculations Modal

## Overview

Add functionality to batch update preset and context window for selected calculations in `ProjectCalculationsList.vue`. This will include a new modal component and a bulk update API endpoint.

## Implementation Plan

### 1. Create Bulk Update Modal Component

Create `apps/dashboard/components/projects/BulkUpdateCalculationsModal.vue`:

- Similar structure to `EditCalculationModal.vue` but simplified for bulk operations
- Props:
  - `calculationIds: string[]` - Array of calculation IDs to update
  - `projectId: string` - Project ID
  - `projectPresetId?: string` - Project's default preset ID
- Features:
  - Preset selector dropdown (with "Project Default" option)
  - Context window input field (optional, can be left empty to use preset default)
  - Show count of calculations being updated
  - Loading state during update
  - Error handling
- Emits:
  - `close` - Close the modal
  - `updated` - Triggered after successful update

### 2. Add Bulk Update Button to ProjectCalculationsList

Update `apps/dashboard/components/projects/ProjectCalculationsList.vue`:

- Add "Update Preset & Context Window" button next to existing bulk action buttons (Tag, Delete, Recalculate)
- Button should only show when `selectedCalculations.length > 0`
- Open the modal when clicked
- Handle the `updated` event to refresh calculations and clear selection

### 3. Create Bulk Update API Endpoint

Add new endpoint in `packages/api/src/routes/calculations.ts`:

- Route: `POST /api/calculations/bulk-update`
- Request body:
  ```typescript
  {
    calculation_ids: number[]
    user_id: string
    preset_id?: string | null  // null = use project default, undefined = keep current
    context_window?: number | null  // null = use preset default, undefined = keep current
  }
  ```

- Logic:
  - Verify all calculations belong to user's projects
  - If `preset_id` is provided:
    - Fetch preset configuration
    - Update each calculation's `model`, `hardware`, `data_center_provider`, `data_center_region` from preset
    - If `context_window` is provided, use it; otherwise use preset's `contextWindow`
    - If `preset_id` is `null` (project default), fetch project preset and apply same logic
  - If only `context_window` is provided (no preset), update only that field
  - Handle `null` values correctly (null means "use preset default", undefined means "keep current")
- Response:
  ```typescript
  {
    success: boolean
    data: {
      updatedCount: number
      calculationIds: number[]
    }
  }
  ```


### 4. Integration Flow

1. User selects calculations via checkboxes
2. Clicks "Update Preset & Context Window" button
3. Modal opens with preset selector and context window input
4. User selects preset (or "Project Default") and optionally sets context window
5. On save:

   - Call `/api/calculations/bulk-update` with calculation IDs, preset_id, and context_window
   - On success, automatically call `/api/calculations/bulk-recalculate` for the updated calculations
   - Emit `updated` event to refresh the list
   - Close modal and clear selection

## Files to Modify

1. **Create**: `apps/dashboard/components/projects/BulkUpdateCalculationsModal.vue`

   - New modal component for bulk updates
   - Uses `usePresets` composable for preset list
   - Similar UI patterns to `EditCalculationModal.vue`

2. **Modify**: `apps/dashboard/components/projects/ProjectCalculationsList.vue`

   - Add bulk update button in the bulk actions section (line ~20-46)
   - Add modal component import and usage
   - Add state for showing modal
   - Add handler for bulk update completion

3. **Modify**: `packages/api/src/routes/calculations.ts`

   - Add new `POST /bulk-update` route handler
   - Place after `bulk-recalculate` endpoint (around line 880)
   - Use similar validation patterns as existing bulk endpoints
   - Leverage `fetchPresetFromDB` helper function

## Technical Details

### Preset Handling

- When `preset_id` is `'project-default'` or `null`, use project's `calculation_preset_id`
- When a specific preset is selected, apply all preset configuration fields
- Context window override: if provided, use it; if `null`, use preset default; if `undefined`, keep current

### Database Updates

- Update `calculations` table fields: `model`, `context_window`, `hardware`, `data_center_provider`, `data_center_region`
- Use `COALESCE` and proper null handling similar to single calculation update endpoint
- Set `updated_at` timestamp

### Error Handling

- Validate calculation IDs belong to user
- Validate preset exists (if provided)
- Handle partial failures gracefully
- Show user-friendly error messages in modal

## Dependencies

- Uses existing `usePresets` composable
- Uses existing `fetchPresetFromDB` helper in API
- Follows same patterns as `EditCalculationModal` and `bulk-recalculate` endpoint