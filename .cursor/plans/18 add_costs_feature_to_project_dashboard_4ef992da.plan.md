---
name: Add Costs Feature to Project Dashboard
overview: Add cost tracking and visualization to the project dashboard, including cost charts (over time and per tag), cost display in calculations list, total costs in summary, and collapsible sections for better organization.
todos:
  - id: add-cost-formatting
    content: Add formatCost() function to formatting.ts utility file
    status: completed
  - id: update-project-charts
    content: Add cost charts (over time and per tag) to ProjectCharts.vue and implement collapsible sections
    status: completed
    dependencies:
      - add-cost-formatting
  - id: update-project-summary
    content: Add total costs calculation and display to ProjectSummary.vue (in Total Tokens block)
    status: completed
    dependencies:
      - add-cost-formatting
  - id: update-calculations-list
    content: Add cost display to each calculation row in ProjectCalculationsList.vue
    status: completed
    dependencies:
      - add-cost-formatting
  - id: update-project-page
    content: Reorganize sections in project page to match new structure with collapsible sections
    status: completed
    dependencies:
      - update-project-charts
  - id: update-types
    content: Update TypeScript types to properly include cost in calculation_parameters
    status: completed
---

# Add Costs Feature to Project Dashboard

## Overview

Add cost tracking and visualization to the project dashboard. Costs are already stored in `calculation_parameters.cost` field. The implementation will add cost charts, display costs in the calculations list, show total costs in the summary, and reorganize sections with collapsible functionality.

## Current Structure

- Filters section (full row)
- CO₂ Emissions charts (over time + per tag) - first row
- Energy Consumption charts (over time + per tag) - second row

## New Structure

- Filters section (full row, collapsible)
- Costs section (full row, collapsible) - two charts: over time + per tag
- CO₂ Emissions section (full row, collapsible) - two charts: over time + per tag
- Energy Consumption section (full row, collapsible) - two charts: over time + per tag

## Implementation Tasks

### 1. Add Cost Formatting Utility

**File**: `apps/dashboard/utils/formatting.ts`

- Add `formatCost()` function to format currency values (e.g., $0.00, $1.23, $1.23K, $1.23M)
- Handle null/undefined values gracefully

### 2. Update ProjectCharts Component

**File**: `apps/dashboard/components/projects/ProjectCharts.vue`

- Add cost chart rendering functions:
  - `renderCostChart()` - line chart showing costs over time (grouped by 6-hour intervals)
  - `renderCostPerTagChart()` - bar chart showing costs grouped by tags
- Add collapsible sections with expand/collapse functionality:
  - Each section (Costs, CO₂ Emissions, Energy Consumption) should have a header with collapse/expand button
  - Use ChevronDown/ChevronUp icons from lucide-vue-next
  - Store collapse state in component state
- Reorganize layout:
  - Costs section (first row: over time, second row: per tag)
  - CO₂ Emissions section (first row: over time, second row: per tag)
  - Energy Consumption section (first row: over time, second row: per tag)
- Extract cost values from `calculation.calculation_parameters?.cost` (handle missing/null values)

### 3. Update ProjectSummary Component

**File**: `apps/dashboard/components/projects/ProjectSummary.vue`

- Add total costs calculation:
  - Compute from `calculations` array when filters are active
  - Compute from `analytics` when no filters (if analytics includes totalCosts, otherwise calculate from all calculations)
- Add costs card to the summary grid (4th card, or update existing Total Tokens card to show both)
- Update Total Tokens card to also display total costs below the token count
- Use `formatCost()` for display

### 4. Update ProjectCalculationsList Component

**File**: `apps/dashboard/components/projects/ProjectCalculationsList.vue`

- Add cost display in each calculation row:
  - Show cost next to CO₂ emissions and energy consumption
  - Extract from `calculation.calculation_parameters?.cost`
  - Use `formatCost()` for display
  - Handle missing cost values gracefully (show "N/A" or hide)

### 5. Update Project Page Layout

**File**: `apps/dashboard/pages/projects/[id].vue`

- Reorganize sections to match new structure:

  1. ProjectSummary
  2. ProjectFilters (collapsible)
  3. ProjectCharts (now includes Costs, CO₂ Emissions, Energy Consumption sections, all collapsible)

### 6. Update Type Definitions (if needed)

**File**: `apps/dashboard/types/watttime.ts`

- Ensure `Calculation` interface properly types `calculation_parameters` to include optional `cost` field
- Consider adding `totalCosts` to `ProjectAnalytics` interface if analytics endpoint should return it

## Technical Details

### Cost Extraction

```typescript
const getCost = (calculation: Calculation): number => {
  return calculation.calculation_parameters?.cost ?? 0
}
```

### Chart Data Preparation

- Cost over time: Group by 6-hour intervals (same as emissions/energy)
- Cost per tag: Sum costs for each tag (same grouping logic as emissions/energy per tag)

### Collapsible Sections

- Use `ref` to track collapsed state for each section
- Toggle on header click
- Smooth transitions using CSS or Vue transitions
- Default state: all sections expanded

## Files to Modify

1. `apps/dashboard/utils/formatting.ts` - Add cost formatting
2. `apps/dashboard/components/projects/ProjectCharts.vue` - Add cost charts and collapsible sections
3. `apps/dashboard/components/projects/ProjectSummary.vue` - Add total costs display
4. `apps/dashboard/components/projects/ProjectCalculationsList.vue` - Add cost display in list
5. `apps/dashboard/pages/projects/[id].vue` - Reorganize layout
6. `apps/dashboard/types/watttime.ts` - Update types if needed

## Testing Considerations

- Verify cost extraction from `calculation_parameters.cost`
- Test with calculations that have no cost data (should handle gracefully)
- Test collapsible sections functionality
- Verify cost aggregation in summary and charts
- Test filtering with costs display