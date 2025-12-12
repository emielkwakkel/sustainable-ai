# Remove Cursor API Functionality

## Overview

Remove all Cursor API functionality used for importing usage data into projects. This includes UI components, composables, API routes, and type definitions.

## Files to Delete

### Frontend Components

- `apps/dashboard/components/ImportFromCursorModal.vue` - Modal for importing from Cursor API
- `apps/dashboard/components/CursorTokenModal.vue` - Modal for setting Cursor API token
- `apps/dashboard/composables/useCursorApi.ts` - Composable for Cursor API operations

### Backend Routes

- `packages/api/src/routes/cursor-import.ts` - API routes for Cursor import functionality

## Files to Modify

### Settings Page

**File:** `apps/dashboard/pages/settings.vue`

- Remove Cursor API Status section (lines 143-232)
- Remove CursorTokenModal component and related state/handlers
- Remove Cursor API related imports and handlers:
- `isCursorTokenModalOpen` state
- `isTestingCursor` state
- `cursorTestResult` state
- `openCursorTokenModal`, `closeCursorTokenModal`, `handleCursorTokenSet` handlers
- `testCursorConnection`, `clearCursorToken` handlers
- Update `connectionStatus.overall` calculation to exclude Cursor status

### Projects Detail Page

**File:** `apps/dashboard/pages/projects/[id].vue`

- Remove `ImportFromCursorModal` import and component usage (lines 106-111, 181)
- Remove `showImportModal` state
- Remove `handleDataImported` handler (or update to only handle CSV import)
- Update `ProjectHeader` to remove `@import-api` event handler

### Project Header Component

**File:** `apps/dashboard/components/projects/ProjectHeader.vue`

- Remove "Import from Cursor" button (lines 24-30)
- Remove `import-api` emit from interface

### Project Composable

**File:** `apps/dashboard/composables/useProject.ts`

- Remove `importFromCursor` function (lines 236-268)

### Token Manager Composable

**File:** `apps/dashboard/composables/useTokenManager.ts`

- Remove `CursorConnectionStatus` import
- Remove `cursorStatus` state (lines 16-19)
- Remove `checkCursorStatus` function (lines 115-130)
- Update `connectionStatus` computed to exclude Cursor status (line 26)
- Remove Cursor status check from `checkConnectionStatus` (line 140)
- Remove `cursorStatus` and `checkCursorStatus` from return object

### Type Definitions

**File:** `apps/dashboard/types/watttime.ts`

- Remove `CursorConnectionStatus` interface (lines 55-58)
- Remove `cursor` property from `ConnectionStatus` interface (line 63)
- Remove `CursorImportApiResponse` interface (lines 122-134)
- Remove `CursorTestApiResponse` interface (lines 136-140)
- Remove `CursorImport` interface (lines 355-363)
- Remove `CursorUsageData` interface (lines 366-375)

### API Server

**File:** `packages/api/src/index.ts`

- Remove `cursorImportRoutes` import (line 15)
- Remove `/api/cursor-import` route registration (line 48)

## Database Considerations

The `cursor_imports` table will remain in the database but will no longer be used. No migration is needed to drop it as it may contain historical data.

## Testing Checklist

- [ ] Settings page loads without Cursor API section
- [ ] Projects detail page loads without Cursor import button
- [ ] Project header no longer shows Cursor import button
- [ ] No console errors related to Cursor API
- [ ] Connection status calculation works without Cursor status