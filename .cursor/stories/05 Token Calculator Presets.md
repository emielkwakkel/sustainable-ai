# Token Calculator Presets - User Story

## Overview
Users need the ability to save and manage calculation configurations as presets to quickly access commonly used setups without re-entering all parameters each time. This feature will include default presets based on real-world scenarios and allow users to create, save, and delete their own custom presets.

## User Story
As a sustainability manager or AI developer
I want to save my token calculation configurations as presets
So that I can quickly access commonly used setups and compare different scenarios without manually re-entering parameters each time

## Acceptance Criteria
- [ ] I can see two default presets available when I first use the calculator
- [ ] I can select a preset to automatically populate all calculation fields
- [ ] I can save my current calculation configuration as a new preset with a custom name
- [ ] I can delete any preset I have created (but not the default presets)
- [ ] I can see a list of all available presets in the calculator interface
- [ ] When I select a preset, all form fields update to match the preset configuration
- [ ] I can modify a preset's configuration and save it with the same name
- [ ] Presets are saved locally and persist between browser sessions

## User Experience Flow
1. User opens the Token Calculator page
2. User sees a "Presets" section with available presets listed
3. User can click on a preset name to load that configuration
4. All form fields automatically populate with the preset values
5. User can modify any values and save as a new preset
6. User can delete their custom presets from the preset list
7. User can export/import presets for sharing with team members

## Success Metrics
- Users can save and load presets in under 3 clicks
- 90% of users utilize at least one preset within their first session
- Users can create custom presets for their specific use cases
- Default presets cover the most common calculation scenarios

## Default Presets

### GPT-4 Token Research
Based on the research paper methodology for accurate carbon tracking:
- **Model**: GPT-4
- **Hardware**: NVIDIA A100
- **Data Center**: Google Cloud Korea
- **Context Length**: 8,000 tokens
- **Context Window**: 1,250 tokens
- **Token Count**: 1,000 (default)
- **Purpose**: Matches the research paper calculations for academic and research use

### Cursor.ai
Based on Cursor's actual infrastructure as reported in The Pragmatic Engineer:
- **Model**: GPT-4 (assuming Cursor uses GPT-4 for their AI features)
- **Hardware**: NVIDIA H100
- **Data Center**: Azure US (based on Cursor's infrastructure details)
- **Context Length**: 8,000 tokens
- **Context Window**: 1,250 tokens
- **Token Count**: 1,000 (default)
- **Purpose**: Represents real-world usage patterns for AI-powered development tools

## Edge Cases
- What happens when a user tries to save a preset with an empty name
- How the system handles duplicate preset names
- What happens when a user tries to delete a default preset
- How the system handles corrupted or invalid preset data
- What happens when a preset references a model or hardware that no longer exists

## Future Enhancements
- Ability to share presets with team members via URL or export/import
- Preset categories (e.g., "Research", "Production", "Development")
- Preset templates for different industries or use cases
- Integration with team settings to create organization-wide presets
- Preset usage analytics to understand common configurations
- Ability to set a preset as the default for new calculations

## Technical Considerations
- Presets should be stored in browser localStorage for persistence
- Preset data should include all form fields and calculation parameters
- Default presets should be immutable and always available
- Preset validation to ensure all required fields are present
- Graceful handling of preset data migration if calculation parameters change

## Business Value
- Reduces time spent re-entering common configurations
- Enables quick comparison between different calculation scenarios
- Provides real-world examples through default presets
- Improves user experience and adoption of the calculator
- Supports team collaboration through shareable configurations
