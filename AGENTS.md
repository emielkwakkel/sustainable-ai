# Sustainable AI Platform - Agent Guidelines

## Project Overview

The Sustainable AI Platform is a comprehensive ecosystem for carbon-aware AI development, consisting of multiple packages that work together to provide calculation engines, APIs, CLI tools, and web interfaces.

## Project Context

### Business Background

The platform addresses the growing need for environmental sustainability in AI development by providing tools to:
- Calculate carbon emissions from AI model usage
- Monitor real-time carbon intensity across regions
- Optimize AI workloads for environmental impact
- Integrate sustainability metrics into CI/CD pipelines

### Technical Requirements

#### Core Requirements
- **Framework**: Nuxt.js 4 (Vue.js based) for dashboard
- **Styling**: Tailwind CSS 4.1, use utility classes only, with ChadCN components
- **API**: Electricity Maps API (https://portal.electricitymaps.com/developer-hub/api/getting-started#introduction)
- **Environment**: Localhost development only
- **Testing**: Unit or integration tests for key components
- **Architecture**: Nx monorepo with npm workspaces

#### Functional Requirements
- **Platform Structure**:
  - Core calculation engine as separate package
  - Configuration and PUE data as separate package
  - REST API server as separate package
  - CLI tool as separate package
  - Dashboard application as separate app
  - Shared TypeScript types across all packages
- **Dashboard Features**:
  - Vertical main menu with icons and text labels
  - Collapsible sidebar navigation
  - Responsive design for all device sizes
  - Accessibility support with keyboard navigation
  - Real-time carbon intensity monitoring across multiple regions
  - Color-coded tiles (red 0-33%, orange 34-66%, green 67-100%)
  - Add regions via dropdown with full region names
  - Support for both MOER and AOER metrics when available
- **Token Calculator**:
  - Calculate carbon emissions and energy consumption based on AI model token usage
  - Configurable parameters: model type, context length, context window, data center PUE, hardware type, and regional carbon intensity
  - Display results in both joules/kWh (energy) and grams CO₂ (emissions)
  - Default assumptions based on GPT-4 with 8,000 context length, 1,250 context window, NVIDIA A100, Google Cloud Korea (PUE 1.1, 0.459 kg CO₂/kWh)
  - Target accuracy: ~0.0859 grams CO₂ per token, ~673.2 joules per token
  - Include comparison metrics (e.g., "equivalent to running a lightbulb for X minutes")
  - Export functionality for calculation results
- **API Server**:
  - REST API endpoints for calculations
  - Configuration endpoints for models, hardware, and data centers
  - Health check endpoints
  - JSON response format
- **CLI Tool**:
  - Command-line interface for CI/CD integration
  - Calculate emissions from command line
  - List available models, hardware, and data centers
  - Configuration management
  - Multiple output formats (JSON, table, CSV)
- **Settings**:
  - **Register to WattTime**: a section that uses the register API to obtain a WattTime account
  - **Connect to WattTime**: a section that uses the login API to obtain a WattTime token, which is stored in the browser localstorage
  - User preferences and application configuration
  - Secure token management with expiration handling

## File Organization

```
sustainable-ai-platform/
├── packages/
│   ├── core/                    # Core calculation engine
│   │   ├── src/
│   │   ├── project.json
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── config/                  # Configuration and PUE data
│   │   ├── src/
│   │   ├── data/
│   │   ├── project.json
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── api/                     # REST API server
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── middleware/
│   │   │   └── services/
│   │   ├── project.json
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── cli/                     # Command-line interface
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   └── utils/
│   │   ├── project.json
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── types/                   # Shared TypeScript types
│       ├── src/
│       ├── project.json
│       ├── package.json
│       └── tsconfig.json
├── apps/
│   └── dashboard/               # Nuxt.js dashboard application
│       ├── components/
│       ├── composables/
│       ├── pages/
│       ├── server/
│       ├── types/
│       ├── utils/
│       ├── assets/
│       ├── test/
│       ├── tests/
│       ├── project.json
│       ├── app.vue
│       ├── nuxt.config.ts
│       ├── tsconfig.json
│       ├── vitest.config.ts
│       └── package.json
├── certs/                        # Localhost certificates
├── docs/                        # Platform documentation
├── .cursor/                     # Cursor AI configuration
│   └── mcp.json                 # MCP server configuration
├── nx.json                      # Nx workspace configuration
├── package.json                 # Root workspace configuration
└── AGENTS.md                   # Agent guidelines
```

## Development Guidelines

### Architecture Decisions
1. **Nx Monorepo Structure**: Use Nx for workspace management and task orchestration
2. **Component-based Architecture**: Reusable Vue components in dashboard
3. **Composition API**: Use Vue 3 Composition API with `<script setup>`
4. **TypeScript**: Full type safety throughout all packages
5. **Responsive Design**: Mobile-first approach with Tailwind 4.1 CSS
6. **Modular Packages**: Each package has a specific responsibility
7. **Shared Types**: Common TypeScript definitions across packages
8. **AI Enhancement**: Nx MCP server for enhanced AI capabilities

### State Management
- Use Nuxt's built-in `useState` for global state in dashboard
- Implement proper loading and error states
- Use package-specific state management for other packages

### Error Handling
- API failure scenarios
- Network connectivity issues
- Graceful degradation for missing data
- Proper error boundaries in all packages

### Performance Considerations
- Lazy load components when possible
- Implement proper caching for API responses
- Optimize images and assets
- Use Nuxt's built-in performance features
- Minimize bundle size across all packages
- Leverage Nx's task caching and parallelization

### HTTPS Development Setup
- **SSL Certificates**: Self-signed certificates for localhost HTTPS development
- **Certificate Generation**: Use `nx run dashboard:setup:certificates` to generate certificates
- **Development Server**: Use `nx start dashboard` for HTTPS development
- **Security Note**: Certificates are gitignored and regenerated for each environment
- **Browser Warning**: Self-signed certificates will show security warnings (normal for development)

### Testing Strategy
- Unit tests for utility functions and composables
- Component tests for user interactions
- Integration tests for API calls
- Accessibility testing with automated tools
- Package-specific test suites with Nx test runners

### Accessibility Requirements
- Semantic HTML structure
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance
- Focus management

## Development Workflow

### Getting Started
1. Clone the repository
2. Install dependencies: `npm install`
3. Generate SSL certificates: `nx run dashboard:setup:certificates`
4. Start development server: `nx serve dashboard`
5. Open https://localhost:3000 in browser

### Package Development
```bash
# Work on specific package
nx build core
nx test config
nx serve api
nx serve cli

# Work on dashboard
nx serve dashboard
```

### Nx Commands
```bash
# Build all projects
nx build

# Test all projects
nx test

# Lint all projects
nx lint

# Type check all projects
nx type-check

# Run specific project
nx serve dashboard
nx build core
nx test api

# Show project graph
nx graph

# Show affected projects
nx affected:graph
```

### Application Roadmap
This Roadmap is prioritized:
- [x] [01 Setup Platform Structure](./.cursor/stories/01%20App%20Structure.md)
- [x] [02 Implement Settings](./.cursor/stories/02%20Settings.md)
- [x] [03 Implement Dashboard](./.cursor/stories/03%20Dashboard.md)
- [x] [04 Implement Token Calculator](./.cursor/stories/04%20Token%20Calculator.md)
- [x] [05 Implement API Server](./.cursor/stories/05%20API%20Server.md)
- [x] [06 Implement CLI Tool](./.cursor/stories/06%20CLI%20Tool.md)
- [x] [07 Migrate to Nx](./.cursor/stories/07%20Nx%20Migration.md)

### Code Quality Standards
- Use ESLint and Prettier for code formatting
- Implement proper TypeScript types
- Write meaningful commit messages
- Follow Vue.js style guide
- Maintain test coverage above 80%
- Follow sustainable coding practices
- Use Nx generators for consistent code generation

## Common Patterns

### Core Engine Pattern
```typescript
// packages/core/src/index.ts
import { sustainableAICalculator } from '@susai/core'

const result = sustainableAICalculator.calculateFromFormData(formData)
```

### Configuration Pattern
```typescript
// packages/config/src/index.ts
import { aiModels, hardwareConfigs, dataCenterProviders } from '@susai/config'

const model = aiModels.find(m => m.id === 'gpt-4')
```

### API Pattern
```typescript
// packages/api/src/routes/calculation.ts
router.post('/calculate', (req, res) => {
  const result = sustainableAICalculator.calculateFromFormData(req.body.formData)
  res.json({ success: true, data: result })
})
```

### CLI Pattern
```typescript
// packages/cli/src/commands/calculate.ts
program
  .command('calculate')
  .option('-t, --tokens <number>', 'Number of tokens')
  .action(async (options) => {
    const result = sustainableAICalculator.calculateFromFormData(formData)
    console.log(result)
  })
```

### Dashboard Pattern
```vue
<!-- apps/dashboard/components/TokenCalculator.vue -->
<template>
  <div class="token-calculator">
    <!-- Component template -->
  </div>
</template>

<script setup lang="ts">
import { sustainableAICalculator } from '@susai/core'
import { aiModels } from '@susai/config'

// Component logic
</script>
```

### Error Handling Pattern
```typescript
// Across all packages
try {
  const result = await someOperation()
  return { success: true, data: result }
} catch (error) {
  return { success: false, error: error.message }
}
```

## Package Dependencies

### Core Package
- `@sustainable-ai/types` - Shared types
- `@sustainable-ai/config` - Configuration data

### Config Package
- `@sustainable-ai/types` - Shared types

### API Package
- `@sustainable-ai/types` - Shared types
- `@sustainable-ai/core` - Calculation engine
- `@sustainable-ai/config` - Configuration data
- `express` - Web framework
- `cors` - CORS middleware
- `helmet` - Security middleware

### CLI Package
- `@sustainable-ai/types` - Shared types
- `@sustainable-ai/core` - Calculation engine
- `@sustainable-ai/config` - Configuration data
- `commander` - CLI framework
- `chalk` - Terminal styling
- `ora` - Loading spinners

### Dashboard Package
- `@sustainable-ai/types` - Shared types
- `@sustainable-ai/core` - Calculation engine
- `@sustainable-ai/config` - Configuration data
- `nuxt` - Vue framework
- `@nuxtjs/tailwindcss` - Styling
- `lucide-vue-next` - Icons

## AI Enhancement with Nx MCP

The platform now includes Nx MCP (Model Context Protocol) server integration for enhanced AI capabilities:

### MCP Server Features
- **Workspace Architecture Understanding**: AI can understand project relationships and dependencies
- **Project Graph Analysis**: Visualize and analyze project connections
- **Code Generation**: AI-enhanced generators for consistent code scaffolding
- **CI Integration**: Connect to CI pipelines for failure resolution
- **Documentation Awareness**: Access to Nx documentation for accurate guidance

### MCP Configuration
The MCP server is configured in `.cursor/mcp.json`:
```json
{
  "servers": {
    "nx-mcp": {
      "command": "npx",
      "args": ["nx-mcp@latest"]
    }
  }
}
```

### AI Assistant Capabilities
With Nx MCP, your AI assistant can:
- Understand your workspace structure and project relationships
- Identify project owners and team responsibilities
- Access Nx documentation for accurate guidance
- Leverage code generators for consistent scaffolding
- Connect to your CI pipeline to help fix failures
- Provide architectural awareness for better decision making

## Sustainable Development Practices

### 1. Energy Efficiency
- **Optimize API calls**: Minimize unnecessary requests to reduce server load and energy consumption
- **Implement intelligent caching**: Cache weather data appropriately to reduce API calls
- **Use efficient algorithms**: Choose algorithms with better time/space complexity
- **Lazy loading**: Load components and data only when needed
- **Debounce user inputs**: Prevent excessive API calls during city search

### 2. Resource Optimization
- **Bundle size optimization**: Keep JavaScript bundles small to reduce download energy
- **Image optimization**: Use appropriate image formats and sizes
- **Tree shaking**: Remove unused code from production builds
- **Code splitting**: Load only necessary code for each route/feature
- **Minimize dependencies**: Only include essential packages

### 3. Performance Best Practices
- **Efficient state management**: Use reactive patterns that minimize re-renders
- **Memoization**: Cache expensive computations and API responses
- **Virtual scrolling**: For large datasets (if applicable)
- **Efficient DOM updates**: Minimize DOM manipulations
- **Use Web Workers**: For CPU-intensive tasks to avoid blocking the main thread

## Long-term Sustainability

### 1. Maintainability
- **Documentation**: Keep comprehensive documentation up to date
- **Code reviews**: Regular code quality reviews
- **Refactoring**: Regular code refactoring for efficiency
- **Testing**: Maintain high test coverage

### 2. Scalability
- **Efficient architecture**: Design for future growth
- **Modular components**: Easy to extend and modify
- **Performance monitoring**: Continuous performance tracking
- **Resource optimization**: Regular optimization reviews

### 3. Environmental Impact
- **Green hosting**: Consider environmentally friendly hosting options
- **Efficient algorithms**: Choose algorithms with lower computational complexity
- **Resource sharing**: Implement efficient resource sharing patterns
- **Carbon awareness**: Consider environmental impact in technical decisions