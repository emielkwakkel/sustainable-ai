# Usage Events Import - User Story

## Overview
The Usage Events Import feature enables users to import historical AI model usage data from CSV files into their projects. This allows users to track carbon emissions based on actual usage patterns from their AI development tools, providing accurate environmental impact calculations without manual data entry.

## User Story

### Main Story
As a sustainability manager or AI developer
I want to import my historical AI model usage events from CSV files into a project
So that I can calculate accurate carbon emissions based on real usage data and track environmental impact over time

### Supporting Stories

#### Bulk Data Import
As a project manager
I want to import multiple usage events at once from a CSV file
So that I can efficiently add large amounts of historical data without manual entry

#### Duplicate Prevention
As a user managing multiple data sources
I want the system to automatically skip entries that have already been imported
So that I can safely re-import files or merge data from multiple sources without creating duplicates

#### Data Validation
As a user importing usage data
I want to see clear feedback about which entries were successfully imported and which were skipped
So that I can verify the import was successful and identify any data quality issues

## Acceptance Criteria

### File Import Process
- [ ] User can select a CSV file from their device to import
- [ ] User can access CSV import from the project detail page via "CSV Import from Cursor" button
- [ ] CSV import button is clearly distinguished from the API-based "Import from Cursor" button
- [ ] User can preview the file contents before confirming import
- [ ] System validates that the CSV file contains required columns (Date, Kind, Model, token counts, etc.)
- [ ] User receives clear error messages if the file format is invalid or missing required data
- [ ] System shows progress feedback during the import process

### Data Mapping and Import
- [ ] System correctly maps CSV columns to usage event fields (Date, Kind, Model, Input tokens, Output tokens, Total tokens, Cost)
- [ ] System creates calculation entries for each valid usage event in the selected project
- [ ] System uses the project's calculation preset to determine default parameters for emissions calculations
- [ ] System preserves all original data from the CSV file in the imported entries
- [ ] System automatically calculates carbon emissions and energy consumption for each imported event using the calculation API
- [ ] Each imported row has complete calculation results stored with the entry

### Duplicate Detection
- [ ] System identifies entries where the datetime stamp matches exactly with existing entries in the project
- [ ] System automatically skips duplicate entries without user intervention
- [ ] System does not create duplicate calculation entries for events with matching timestamps
- [ ] System reports how many entries were skipped due to duplicates in the import summary

### Import Results and Feedback
- [ ] User sees a summary after import showing total entries processed, successfully imported, and skipped
- [ ] User can see which specific entries were skipped and why (duplicate, invalid data, etc.)
- [ ] User can view the newly imported entries in the project dashboard immediately after import
- [ ] Project dashboard updates with new totals and charts reflecting the imported data
- [ ] User can export the import results for their records

### Data Quality Handling
- [ ] System handles missing or invalid date values gracefully
- [ ] System handles missing token counts by using appropriate defaults or skipping invalid entries
- [ ] System preserves all available data even when some fields are missing
- [ ] System provides warnings for entries with missing or suspicious data
- [ ] User can review and correct data quality issues before finalizing import

### Carbon Emissions Calculation
- [ ] Every imported usage event automatically triggers a calculation using the calculation API endpoint
- [ ] Calculation results (energy consumption and carbon emissions) are stored with each imported entry
- [ ] System uses the project's calculation preset to determine calculation parameters
- [ ] If calculation fails for an entry, the entry is still saved but marked as needing recalculation
- [ ] User receives feedback about entries that failed calculation during import

### Recalculation Capabilities
- [ ] User can recalculate a single imported entry by selecting it and clicking "Recalculate"
- [ ] User can select multiple entries and recalculate them as a group
- [ ] User can recalculate all entries in a project using updated calculation parameters or algorithms
- [ ] System shows before/after comparison when recalculating entries
- [ ] Recalculation preserves original calculation parameters and timestamp
- [ ] System shows progress feedback during batch recalculation operations
- [ ] Project analytics update automatically after recalculation

### Project Dashboard Improvements
- [ ] Project detail page loads without errors (404 errors are resolved)
- [ ] Project detail page includes a summary section showing key metrics at a glance
- [ ] Summary section displays total emissions, energy consumption, and calculation count
- [ ] Charts are implemented using d3.js for visual data representation
- [ ] Charts show emissions over time and energy consumption over time
- [ ] Charts are responsive and update when new data is imported or recalculated
- [ ] Page sections are organized into reusable components in the projects components folder
- [ ] Components are modular and can be easily maintained or extended

### Component Architecture
- [ ] Project detail page sections are split into separate components
- [ ] Components are organized in `apps/dashboard/components/projects` folder
- [ ] Summary section is a separate reusable component
- [ ] Charts section is a separate reusable component
- [ ] Recent calculations list is a separate reusable component
- [ ] Analytics summary cards are separate reusable components
- [ ] Components follow consistent styling and behavior patterns

## User Experience Flow

### Importing Usage Events from CSV
1. User navigates to a project dashboard
2. User clicks "CSV Import from Cursor" button (distinct from "Import from Cursor" API button)
3. User selects a CSV file from their device using file picker
4. System validates file format and shows preview of first few rows
5. User reviews preview and confirms import
6. System processes the file, importing entries and skipping duplicates
7. For each imported entry, system automatically calculates emissions using the calculation API
8. System displays import summary showing:
   - Total entries processed
   - Successfully imported entries
   - Entries with successful calculations
   - Entries that need recalculation
   - Skipped entries (with reasons)
   - Any data quality warnings
9. User clicks "View Imported Data" to see new entries in project
10. Project dashboard updates with new totals, summary section, and refreshed charts

### Recalculating Individual Entries
1. User views calculations list in project dashboard
2. User selects a single calculation entry
3. User clicks "Recalculate" button or action
4. System uses current calculation parameters to recalculate emissions
5. System shows updated results with before/after comparison
6. Project analytics update automatically
7. Charts refresh to show updated data

### Recalculating Multiple Entries
1. User views calculations list in project dashboard
2. User selects multiple calculation entries using checkboxes
3. User clicks "Recalculate Selected" button
4. System shows confirmation dialog with count of entries to recalculate
5. User confirms recalculation
6. System processes each entry and shows progress feedback
7. System shows summary of updated entries
8. Project analytics update automatically
9. Charts refresh to show updated data

### Viewing Project Summary
1. User navigates to project detail page
2. Page loads successfully without errors
3. User sees summary section at top with key metrics:
   - Total CO₂ emissions
   - Total energy consumption
   - Total calculation count
4. User sees analytics cards showing detailed breakdowns
5. User sees interactive charts showing trends over time
6. User sees recent calculations list below charts

### Handling Import Errors
1. User attempts to import invalid CSV file
2. System displays error message explaining what's wrong (missing columns, invalid format, etc.)
3. User can correct the file and try again
4. System provides example of expected CSV format if needed

### Re-importing the Same File
1. User imports a CSV file successfully
2. User attempts to import the same file again (or file with overlapping dates)
3. System processes the file and identifies duplicate entries by matching datetime stamps
4. System skips all duplicate entries automatically
5. System imports only new entries that weren't previously imported
6. User sees summary showing all entries were skipped (or only new ones imported)

## Success Metrics

### Import Efficiency
- Percentage of successful imports on first attempt
- Average time to import files of various sizes
- Number of entries successfully imported per session
- Reduction in manual data entry time

### Data Quality
- Percentage of imported entries with complete data
- Number of entries skipped due to duplicates
- Number of data quality warnings per import
- Accuracy of duplicate detection (false positives/negatives)

### User Adoption
- Number of users importing usage events
- Frequency of imports per user
- Average file size being imported
- User satisfaction with import process

### Environmental Impact
- Total usage events tracked across all projects
- Carbon emissions calculated from imported data vs manual entries
- Accuracy improvement from using real usage data vs estimates

## Edge Cases

### File Format Issues
- CSV file with missing required columns
- CSV file with extra columns that should be ignored
- CSV file with different date formats (ISO 8601, local formats, etc.)
- CSV file with encoding issues (UTF-8, Windows-1252, etc.)
- CSV file with empty rows or rows with partial data
- CSV file with very large number of entries (performance considerations)

### Data Quality Issues
- Entries with invalid datetime stamps (future dates, unparseable formats)
- Entries with negative token counts or costs
- Entries with missing token counts (zero or null values)
- Entries with very large token counts that might indicate data errors
- Entries with special characters in model names or other fields

### Duplicate Detection Scenarios
- Exact timestamp match (should skip)
- Timestamp match within same second but different milliseconds
- Timestamp match but different other fields (should still skip based on timestamp)
- User imports same file multiple times
- User imports overlapping date ranges from different files
- User imports file that partially overlaps with existing data

### Performance and Scalability
- Importing files with thousands of entries
- Importing multiple files in quick succession
- Importing while project dashboard is open and needs to update
- Network connectivity issues during import
- Browser timeout for very large files

### User Experience
- User navigates away during import process
- User closes browser tab during import
- User tries to import same file simultaneously in multiple tabs
- User cancels import after preview but before confirmation
- Import fails partway through - what happens to partially imported data?
- Project detail page fails to load (404 errors)
- Calculation API fails during import for some entries
- Recalculation fails for some entries in a batch operation

### API and System Reliability
- Calculation API endpoint returns errors or timeouts
- Project detail API endpoint returns 404 errors
- Database connection issues during import
- Calculation API rate limiting during bulk imports
- Network connectivity issues during recalculation
- Browser memory limitations for large imports

## Future Enhancements

### Import Format Expansion
- Support for JSON import format
- Support for Excel files (.xlsx, .xls)
- Support for importing from other AI development tools (GitHub Copilot, Replit, etc.)
- Automatic detection of file format without user selection

### Advanced Import Options
- User can map CSV columns to fields manually if column names differ
- User can filter which entries to import based on date range or other criteria
- User can preview and edit entries before final import
- User can schedule automatic imports from file locations
- User can import and merge data from multiple sources in one operation

### Data Enhancement
- Automatic enrichment of imported data with additional metadata
- Suggestions for missing fields based on historical patterns
- Validation rules that can be customized per project
- Automatic data cleaning and normalization during import

### Integration and Automation
- Direct import from API endpoints (Cursor API, etc.)
- Automated daily/weekly imports from configured sources
- Webhook support for real-time usage event streaming
- Integration with development tools for automatic usage tracking

### Advanced Recalculation Features
- Scheduled automatic recalculation when calculation algorithms improve
- Recalculation queue for large projects
- Batch recalculation with progress tracking and pause/resume
- Comparison view showing changes from recalculation
- Export recalculation history and audit logs

### Enhanced Visualization
- Interactive charts with zoom and pan capabilities
- Additional chart types (pie charts, heat maps, etc.)
- Customizable date ranges for chart views
- Export charts as images or PDFs
- Real-time chart updates as data changes

### Performance Optimizations
- Lazy loading for large calculation lists
- Virtual scrolling for thousands of entries
- Optimized API calls with caching
- Background processing for large imports
- Progressive chart rendering for better performance

## Business Value

### For Sustainability Managers
- Accurate carbon footprint calculations based on real usage data
- Time savings from automated data import vs manual entry
- Historical tracking of AI usage patterns over time
- Comprehensive reporting with actual usage data
- Ability to update calculations when methods improve, ensuring always-current data
- Visual dashboards with charts for stakeholder presentations

### For Development Teams
- Easy integration of existing usage logs into sustainability tracking
- No need to manually enter hundreds or thousands of usage events
- Confidence that duplicate entries won't create inflated emissions data
- Ability to track environmental impact retroactively
- Flexible recalculation options to refine estimates as better data becomes available
- Clear project summaries and visualizations for understanding impact

### For Organizations
- Reliable data for sustainability reporting and compliance
- Reduced risk of data entry errors in emissions calculations
- Scalable solution for tracking usage across multiple projects
- Foundation for automated sustainability monitoring
- Ability to maintain accurate historical records with recalculated data
- Professional visualizations for sustainability reporting and presentations

## Technical Requirements

### API Endpoints
- CSV import endpoint that accepts file uploads and processes entries
- Calculation API integration for automatic emissions calculation during import
- Recalculation endpoints for single and batch operations
- Project detail API endpoint that returns complete project information without errors
- Calculations API endpoint (`/api/calculations/project/:projectId`) returns proper response format matching expected structure
- API endpoints handle errors gracefully and return consistent response format with success/error indicators

### Component Structure
- Modular component architecture in `apps/dashboard/components/projects`
- Reusable components for summary, charts, and calculations list
- Separation of concerns for better maintainability

### Chart Implementation
- d3.js integration for data visualization
- Responsive charts that adapt to different screen sizes
- Real-time updates when data changes
- Performance optimization for large datasets

### Error Handling
- Graceful handling of API failures during import
- Clear error messages for users
- Partial import success handling
- Recovery mechanisms for failed calculations

