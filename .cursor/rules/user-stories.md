---
description: Guidelines for writing user stories from product owner perspective
alwaysApply: false
---

# User Stories Writing Guidelines

## Overview
User stories should be written from the product owner's perspective, focusing on user needs and business value rather than technical implementation details.

## Writing Principles

### User-Centric Language
- Write from the user's perspective
- Focus on what the user wants to accomplish
- Use business language, not technical jargon
- Describe the value and benefit to the user

### Story Structure
Follow the standard format:
```
As a [user type]
I want [functionality]
So that [benefit/value]
```

### Acceptance Criteria
- Write in plain language that stakeholders can understand
- Focus on behavior and outcomes, not implementation
- Use "Given/When/Then" format for complex scenarios
- Avoid technical specifications and code examples

## Content Guidelines

### What to Include
- **Status** `Open`, `In progress`, `Closed` or `Rejected`
- **User personas** and their specific needs
- **Business value** and impact
- **User experience flows** and interactions
- **Success metrics** and measurable outcomes
- **Edge cases** and error scenarios
- **Accessibility requirements** from user perspective
- **Performance expectations** in user terms

### What to Avoid
- Code snippets or technical implementation details
- API endpoints or database schemas
- Framework-specific terminology
- Technical architecture decisions
- Implementation patterns or code examples

## Story Organization

### File Structure
- Store user stories in `.cursor/stories/` directory
- Use descriptive filenames: `[Feature Name].md`
- Number stories for easy reference: `01 Feature Name.md`

### Story Sections
1. **Overview** - Brief description of the feature
2. **User Story** - Main story with acceptance criteria
3. **User Experience Flow** - Step-by-step user journey
4. **Success Metrics** - Measurable outcomes
5. **Edge Cases** - Error scenarios and exceptions
6. **Future Enhancements** - Potential improvements

## Writing Examples

### Good User Story
```
As a sustainability manager
I want to calculate the carbon footprint of my AI model usage
So that I can make informed decisions about model selection and usage patterns to reduce environmental impact

Acceptance Criteria:
- I can input the number of tokens used in my AI inference
- I can select from predefined models with pre-configured parameters
- I can adjust key calculation assumptions like data center location and hardware type
- I see results in both energy consumption and carbon emissions
- I can export my calculation results for reporting
```

### Poor User Story (Too Technical)
```
As a developer
I want to implement a token calculator component
So that I can calculate emissions using the formula: energy = tokens * model_complexity * hardware_efficiency * PUE

Acceptance Criteria:
- Create Vue component with TypeScript interfaces
- Implement useTokenCalculator composable
- Use Tailwind CSS for styling
- Store results in reactive state
```

## Integration with AGENTS.md

### Reference Updates
When creating user stories:
1. Add feature description to AGENTS.md functional requirements
2. Include reference link to the user story file
3. Update development phases to include the feature
4. Add any new patterns or guidelines discovered

### Cross-References
- Link from AGENTS.md to user stories using relative paths
- Ensure story titles match feature names in AGENTS.md
- Keep both documents synchronized

## Quality Checklist

### Before Finalizing a User Story
- [ ] Written from user perspective, not developer perspective
- [ ] Includes clear acceptance criteria in business language
- [ ] Describes user experience flow
- [ ] Defines measurable success metrics
- [ ] Covers edge cases and error scenarios
- [ ] No technical implementation details
- [ ] AGENTS.md updated with references
- [ ] Story is actionable and testable

## Common Mistakes to Avoid

### Technical Focus
- Don't mention specific frameworks, libraries, or technologies
- Avoid API endpoints, database schemas, or code patterns
- Don't specify implementation approaches or architectures

### Developer Perspective
- Don't write from the developer's point of view
- Avoid technical jargon and acronyms
- Don't focus on how to build, focus on what to build

### Vague Requirements
- Don't use ambiguous language like "user-friendly" or "intuitive"
- Be specific about what the user can do
- Define clear, measurable outcomes

## Story Templates

### Feature Story Template
```markdown
# [Feature Name] - User Story

## Overview
Brief description of what this feature does for users.

## User Story
As a [user type]
I want [functionality]
So that [benefit/value]

## Acceptance Criteria
- [ ] User can [specific action]
- [ ] System displays [specific information]
- [ ] User receives [specific feedback]

## User Experience Flow
1. User [action]
2. System [response]
3. User [next action]

## Success Metrics
- [Measurable outcome 1]
- [Measurable outcome 2]

## Edge Cases
- What happens when [error condition]
- How system handles [exception scenario]

## Future Enhancements
- [Potential improvement 1]
- [Potential improvement 2]
```

### Integration Story Template
```markdown
# [Integration Feature] - User Story

## Overview
How this feature connects with external services to provide value.

## User Story
As a [user type]
I want to [integration action]
So that I can [achieve business goal]

## Acceptance Criteria
- [ ] User can [connect/authenticate action]
- [ ] System shows [connection status]
- [ ] User can [use integrated functionality]

## User Experience Flow
1. User [starts integration process]
2. System [guides through steps]
3. User [completes integration]
4. User [benefits from integration]

## Success Metrics
- [Integration success rate]
- [User satisfaction with integration]

## Error Handling
- [Error scenario 1] - [User-friendly message]
- [Error scenario 2] - [Recovery action]
```

Remember: User stories are about the user's journey and business value, not the technical journey of building the feature.
