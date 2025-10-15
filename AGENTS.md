# Sustainable AI Dashboard - Agent Guidelines

## Project Overview


## Project Context

### Business Background


### Technical Requirements

#### Core Requirements
- **Framework**: Nuxt.js 4 (Vue.js based)
- **Styling**: Tailwind CSS 4.1, use utility classes only, with ChadCN components
- **API**: Electricity Maps API (https://portal.electricitymaps.com/developer-hub/api/getting-started#introduction)
- **Environment**: Localhost development only
- **Testing**: Unit or integration tests for key components

#### Functional Requirements
- **App structure**:
  - Feature pages should appear in the vertical main menu.
  - Every menu has a icon and text.
  - The main menu can be collapsed, after which only the menu item icons are visible.
- **Feature pages**:
  - **App Structure**: See [App Structure](./.cursor/stories/01%20App%20Structure.md)
    - Vertical main menu with icons and text labels
    - Collapsible sidebar navigation
    - Responsive design for all device sizes
    - Accessibility support with keyboard navigation
  - **Carbon Aware Dashboard**: See [Dashboard](./.cursor/stories/03%20Dashboard.md)
    - Real-time carbon intensity monitoring across multiple regions
    - Color-coded tiles (red 0-33%, orange 34-66%, green 67-100%)
    - Add regions via dropdown with full region names
    - Support for both MOER and AOER metrics when available
    - Responsive design for all device sizes
  - **Token calculator**: See [Token Calculator](./.cursor/stories/04%20Token%20Calculator.md)
    - Calculate carbon emissions and energy consumption based on AI model token usage
    - Configurable parameters: model type, context length, context window, data center PUE, hardware type, and regional carbon intensity
    - Display results in both joules/kWh (energy) and grams CO₂ (emissions)
    - Default assumptions based on GPT-4 with 8,000 context length, 1,250 context window, NVIDIA A100, Google Cloud Korea (PUE 1.1, 0.459 kg CO₂/kWh)
    - Target accuracy: ~0.0859 grams CO₂ per token, ~673.2 joules per token
    - Include comparison metrics (e.g., "equivalent to running a lightbulb for X minutes")
    - Export functionality for calculation results
  - **Settings**: See [Settings](./.cursor/stories/02%20Settings.md)
    - **Register to WattTime**: a section that uses the register API to obtain a WattTime account
    - **Connect to WattTime**: a section that uses the login API to obtain a WattTime token, which is stored in the browser localstorage
    - User preferences and application configuration
    - Secure token management with expiration handling




## File Organization
```
/
├── components/          # Reusable Vue components
├── composables/         # Vue composables for logic
├── pages/              # Nuxt pages (single page app)
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── assets/             # Static assets
├── public/             # Public assets
├── certs/              # SSL certificates for HTTPS development (gitignored)
└── server/             # Nuxt server API routes
```

## Development Guidelines

### Architecture Decisions
2. **Component-based Architecture**: Reusable Vue components
3. **Composition API**: Use Vue 3 Composition API with `<script setup>`
4. **TypeScript**: Full type safety throughout the application
5. **Responsive Design**: Mobile-first approach with Tailwind 4.1 CSS

### State Management
- Use Nuxt's built-in `useState` for global state
- Implement proper loading and error states

### Error Handling
- API failure scenarios
- Network connectivity issues
- Graceful degradation for missing data

### Performance Considerations
- Lazy load components when possible
- Implement proper caching for API responses
- Optimize images and assets
- Use Nuxt's built-in performance features

### HTTPS Development Setup
- **SSL Certificates**: Self-signed certificates for localhost HTTPS development
- **Certificate Generation**: Use `npm run setup:certificates` to generate certificates
- **Development Server**: Use `npm run dev:https` for HTTPS development
- **Security Note**: Certificates are gitignored and regenerated for each environment
- **Browser Warning**: Self-signed certificates will show security warnings (normal for development)

### Testing Strategy
- Unit tests for utility functions and composables
- Component tests for user interactions
- Integration tests for API calls
- Accessibility testing with automated tools

### Accessibility Requirements
- Semantic HTML structure
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance
- Focus management

## Development Workflow

### Getting Started
1. Initialize Nuxt.js 4 project with TypeScript
2. Install and configure Tailwind CSS and Nuxt ChadCN components
3. Set up testing framework (Vitest)
4. Create basic project structure
5. Generate SSL certificates for HTTPS development
6. Implement API integration layer

### Application roadmap
This Roadmap is prioritised.
- [ ] [01 Setup App Structure](./.cursor/stories/01%20App%20Structure.md)
- [ ] [02 Implement Settings](./.cursor/stories/02%20Settings.md)
- [ ] [03 Implement Dashboard](./.cursor/stories/03%20Dashboard.md)
- [ ] [04 Implement Token Calculator](./.cursor/stories/04%20Token%20Calculator.md)


### Code Quality Standards
- Use ESLint and Prettier for code formatting
- Implement proper TypeScript types
- Write meaningful commit messages
- Follow Vue.js style guide
- Maintain test coverage above 80%

## Common Patterns

### API Integration Pattern
```typescript
// composables/useWeather.ts
export const useWeather = () => {
  const fetchWeather = async (lat: number, lon: number) => {
    // API call implementation
  }
  
  return { fetchWeather }
}
```

### Token Calculator Pattern
```typescript
// composables/useTokenCalculator.ts
export const useTokenCalculator = () => {
  const calculateEmissions = (params: TokenCalculatorParams) => {
    // Calculate energy and carbon emissions based on token usage
    // Returns: { energyJoules, energyKWh, carbonEmissionsGrams }
  }
  
  return { calculateEmissions }
}
```

### Component Pattern
```vue
<template>
  <div class="weather-card">
    <!-- Component template -->
  </div>
</template>

<script setup lang="ts">
interface Props {
  // Component props
}

const props = defineProps<Props>()
// Component logic
</script>
```

### Error Handling Pattern
```typescript
const { data, error, pending } = await useFetch('/api/weather', {
  onResponseError({ response }) {
    // Handle API errors
  }
})
```

