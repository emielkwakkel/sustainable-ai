---
name: Fix Region Filtering and Migrate Grids Data
overview: Fix the dropdown to exclude already-selected regions, move grids.js to the config package, and update the composable to use the centralized region data without descriptions.
todos:
  - id: fix-dropdown-filtering
    content: Update AddRegionTile.vue to filter out already-selected regions from the dropdown list
    status: completed
  - id: convert-grids-to-ts
    content: Convert grids.js to TypeScript format in packages/config/src/data/grids.ts
    status: completed
  - id: create-regions-export
    content: Create packages/config/src/regions.ts to export AvailableRegion[] from grids data
    status: completed
    dependencies:
      - convert-grids-to-ts
  - id: update-config-exports
    content: Update packages/config/src/index.ts to export regions
    status: completed
    dependencies:
      - create-regions-export
  - id: update-composable
    content: Update useCarbonIntensity.ts to import regions from config package and remove hardcoded list
    status: completed
    dependencies:
      - update-config-exports
  - id: remove-description-display
    content: Remove description field display from AddRegionTile.vue template
    status: completed
  - id: delete-grids-js
    content: Delete grids.js from root directory after successful migration
    status: completed
    dependencies:
      - update-composable
---

# Fix Region Filtering and Migrate Grids Data

## Issues to Fix

1. **Region filtering**: Already-added regions still appear in the dropdown (they're disabled but visible)
2. **Region data source**: `availableRegions` in `useCarbonIntensity.ts` is hardcoded and incomplete
3. **Data migration**: Move `grids.js` to config package and use it as the single source of truth

## Implementation Plan

### 1. Fix Region Filtering in AddRegionTile Component

**File**: `apps/dashboard/components/AddRegionTile.vue`

Update the `filteredRegions` computed property to exclude already-selected regions:

```69:78:apps/dashboard/components/AddRegionTile.vue
const filteredRegions = computed(() => {
  // First filter by search query
  let filtered = props.availableRegions
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = props.availableRegions.filter(region => 
      region.name.toLowerCase().includes(query) ||
      region.description?.toLowerCase().includes(query) ||
      region.code.toLowerCase().includes(query)
    )
  }
  
  // Then exclude already selected regions
  return filtered.filter(region => !props.selectedRegions.includes(region.code))
})
```

Also remove the `description` display since we're removing it from the data:

```40:44:apps/dashboard/components/AddRegionTile.vue
<div class="font-medium">{{ region.name }}</div>
```

### 2. Move grids.js to Config Package

**Files to create/modify**:

- `packages/config/src/data/grids.ts` (new - convert grids.js to TypeScript)
- `packages/config/src/regions.ts` (new - export regions in AvailableRegion format)
- `packages/config/src/index.ts` (update - add regions export)

**Steps**:

1. Convert `grids.js` to TypeScript format in `packages/config/src/data/grids.ts`:

   - Export as a const array with proper typing
   - Keep the same structure: `{ code: string, name: string }`

2. Create `packages/config/src/regions.ts`:

   - Import grids data
   - Transform to `AvailableRegion[]` format (code, name only - no description)
   - Export as `availableRegions`

3. Update `packages/config/src/index.ts`:

   - Add `export * from './regions'`

4. Delete `grids.js` from root after migration

### 3. Update useCarbonIntensity Composable

**File**: `apps/dashboard/composables/useCarbonIntensity.ts`

Replace the hardcoded `availableRegions` array with an import from the config package:

```1:47:apps/dashboard/composables/useCarbonIntensity.ts


import type { 
  CarbonIntensityData, 
  SignalIndexResponse,
  ForecastResponse, 
  DashboardRegion, 
  AvailableRegion,
  ApiResponse 
} from '~/types/watttime'

import { useTokenManager } from '~/composables/useTokenManager'
import { availableRegions } from '@susai/config'

export const useCarbonIntensity = () => {
  const { getTokenInfo } = useTokenManager()
  
  // API base URL - use the API package server with HTTPS
  const API_BASE_URL = 'https://localhost:3001/api'
  
  // Available regions are now imported from config package
  // ... rest of the composable
```

Remove the hardcoded `availableRegions` constant (lines 19-47).

### 4. Update Type Definition (Optional)

**File**: `apps/dashboard/types/watttime.ts`

The `AvailableRegion` interface already has `description?` as optional, so we can keep it for backward compatibility but won't populate it. No changes needed unless we want to remove it entirely (which would require checking other usages).

## Summary of Changes

- **AddRegionTile.vue**: Filter out selected regions from dropdown list
- **grids.js**: Move to `packages/config/src/data/grids.ts` and convert to TypeScript
- **regions.ts**: New file exporting `AvailableRegion[]` from grids data
- **config/index.ts**: Export regions
- **useCarbonIntensity.ts**: Import regions from config package, remove hardcoded list
- **grids.js**: Delete after migration

## Testing Considerations

- Verify dropdown only shows unselected regions
- Verify all regions from grids.js are available
- Verify search still works correctly
- Verify region selection still works
- Verify no references to old grids.js remain