# Dashboard - User Story

## Overview
The Dashboard provides users with a real-time view of carbon intensity across multiple regions, helping them make informed decisions about when and where to run energy-intensive operations.

## User Story

### As a sustainability manager
I want to monitor carbon intensity across different regions in real-time
So that I can schedule energy-intensive tasks during the cleanest times and locations

## Acceptance Criteria

### Core Dashboard Functionality
- [ ] **Check connection** If there is is no active WattTime connection display a banner that links to the Settings page to setup connection.
- [ ] **Region Tiles**: Display current carbon intensity for each selected region
- [ ] **Color Coding**: Visual indicators based on carbon intensity levels
  - Red (0-33%): High carbon intensity, avoid if possible
  - Orange (34-66%): Moderate carbon intensity, use with caution
  - Green (67-100%): Low carbon intensity, optimal for clean energy usage
- [ ] **Real-time Updates**: Carbon intensity data refreshes automatically
- [ ] **Add Region**: Plus tile allows adding new regions to monitor

### Region Management
- [ ] **Region Selection**: Dropdown shows all available WattTime regions
- [ ] **Region Names**: Display full region names for easy identification
- [ ] **Region Values**: Use region abbreviations for API calls
- [ ] **Multiple Regions**: Support monitoring multiple regions simultaneously

### Data Display
- [ ] **MOER Percentile**: Primary carbon intensity metric displayed prominently
- [ ] **AOER Support**: When available, show both MOER and AOER in split tile sections
- [ ] **Percentile Values**: Clear display of current percentile scores
- [ ] **Last Updated**: Show when data was last refreshed

### User Experience
- [ ] **Intuitive Layout**: Clean, organized tile layout
- [ ] **Quick Overview**: Immediate visual assessment of all regions
- [ ] **Easy Management**: Simple process to add/remove regions
- [ ] **Responsive Design**: Works on desktop, tablet, and mobile devices

## User Experience Flow

### Initial Dashboard Load
1. **Empty State**: User sees dashboard with only "Add Region" tile
2. **First Region**: User clicks plus tile to add their first region
3. **Region Selection**: User selects region from dropdown list
4. **Tile Display**: New tile appears showing current carbon intensity
5. **Color Indicator**: Tile background reflects current intensity level

### Adding Additional Regions
1. **Plus Tile**: User clicks on the plus tile
2. **Region Dropdown**: List of available regions appears
3. **Region Selection**: User selects desired region
4. **Tile Creation**: New tile appears alongside existing ones
5. **Data Loading**: Tile shows current carbon intensity for new region

### Monitoring Multiple Regions
1. **Overview Scan**: User quickly scans all tiles for color patterns
2. **Clean Regions**: Green tiles indicate optimal regions for energy use
3. **Avoid Regions**: Red tiles indicate regions to avoid
4. **Decision Making**: User makes informed decisions based on visual data

### Split Tile Display (AOER Available)
1. **Dual Metrics**: Tile splits into two sections when AOER is available
2. **MOER Section**: Shows MOER percentile with appropriate color
3. **AOER Section**: Shows AOER percentile with appropriate color
4. **Clear Labels**: Each section clearly labeled for easy understanding

## Success Metrics
- **User Efficiency**: Users can assess all regions within 5 seconds
- **Decision Making**: 90% of users make cleaner energy choices based on dashboard
- **Data Accuracy**: Carbon intensity data is current within 5 minutes
- **User Satisfaction**: Dashboard usability score > 4.5/5

## Edge Cases

### Data Unavailability
- **No Data**: Show "Data Unavailable" message with gray background
- **Stale Data**: Display last known value with "Last Updated" timestamp
- **Network Issues**: Show connection status and retry option

### Region Limitations
- **Unsupported Region**: Clear message when region is not available
- **API Limits**: Graceful handling when rate limits are reached
- **Invalid Selection**: Validation prevents invalid region selections

### Display Scenarios
- **Many Regions**: Dashboard adapts to show multiple regions efficiently
- **Single Region**: Optimized display for single region monitoring
- **No Regions**: Helpful empty state with clear next steps

## Future Enhancements
- **Historical Trends**: Show carbon intensity trends over time
- **Alerts**: Notifications when carbon intensity reaches optimal levels
- **Favorites**: Save frequently monitored regions for quick access
- **Comparison**: Side-by-side comparison of multiple regions
- **Export**: Export carbon intensity data for reporting
- **Customization**: User-configurable color schemes and thresholds

## Business Value
- **Environmental Impact**: Enables users to reduce carbon footprint through informed timing
- **Cost Savings**: Helps avoid high-carbon periods that may have premium pricing
- **Compliance**: Supports sustainability reporting and carbon accounting
- **Decision Support**: Provides data-driven insights for energy planning
- **Transparency**: Clear visibility into regional energy cleanliness

## User Personas

### Primary Users
- **Sustainability Managers**: Need to monitor multiple regions for operational planning
- **Energy Coordinators**: Require real-time data for scheduling energy-intensive tasks
- **Environmental Analysts**: Need comprehensive view of carbon intensity patterns

### Secondary Users
- **Executives**: Want high-level overview of environmental performance
- **Operations Teams**: Need quick access to current carbon intensity status
- **Compliance Officers**: Require data for environmental reporting requirements
