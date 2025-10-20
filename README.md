# Sustainable AI Platform

A comprehensive platform for carbon-aware AI development, helping developers and organizations monitor and optimize their AI model usage for environmental sustainability.

## Platform Overview

The Sustainable AI Platform is a modular ecosystem consisting of:

- **🌐 Dashboard** - Web interface for carbon intensity monitoring and calculations
- **🧮 Core Engine** - Calculation engine for carbon emissions and energy consumption
- **⚙️ Configuration** - PUE data, AI models, and hardware configurations
- **🔌 API Server** - REST API for programmatic access
- **💻 CLI Tool** - Command-line interface for CI/CD integration
- **📦 Shared Types** - TypeScript definitions across all packages

## Architecture

```
sustainable-ai-platform/
├── packages/
│   ├── core/                    # Core calculation engine
│   ├── config/                  # Configuration and PUE data
│   ├── api/                     # REST API server
│   ├── cli/                     # Command-line interface
│   └── types/                   # Shared TypeScript types
├── apps/
│   └── dashboard/               # Nuxt.js dashboard application
├── docs/                        # Platform documentation
└── package.json                 # Root workspace configuration
```

## Features

### 🌱 Carbon Aware Dashboard
- Real-time carbon intensity monitoring across multiple regions
- Color-coded tiles showing carbon intensity levels (red/orange/green)
- Add regions via dropdown with full region names
- Support for both MOER and AOER metrics when available
- Responsive design for all device sizes

### 🧮 Token Calculator
- Calculate carbon emissions and energy consumption based on AI model token usage
- Configurable parameters: model type, context length, context window, data center PUE, hardware type, and regional carbon intensity
- Display results in both joules/kWh (energy) and grams CO₂ (emissions)
- Default assumptions based on GPT-4 with 8,000 context length, 1,250 context window, NVIDIA A100, Google Cloud Korea (PUE 1.1, 0.459 kg CO₂/kWh)
- Target accuracy: ~0.0859 grams CO₂ per token, ~673.2 joules per token
- Include comparison metrics (e.g., "equivalent to running a lightbulb for X minutes")
- Export functionality for calculation results

### ⚙️ WattTime Integration
- Connect to WattTime API for real-time carbon intensity data
- User registration and authentication
- Secure token management with localStorage
- Connection status monitoring

### 📱 Responsive Design
- Mobile-first approach with Tailwind CSS
- Dark/light mode support
- Accessible UI components (WCAG 2.1 compliant)

### 🧪 Comprehensive Testing
- Unit tests for utility functions and composables
- Component tests for user interactions
- Integration tests for API calls
- Accessibility testing with automated tools

## Tech Stack

- **Framework**: Nuxt.js 4 (Vue.js 3)
- **Styling**: Tailwind CSS 4.1 with ChadCN components
- **Language**: TypeScript
- **Testing**: Vitest
- **APIs**: WattTime API, Electricity Maps API
- **State Management**: Nuxt's built-in useState
- **Icons**: Lucide Vue Next
- **Package Management**: npm workspaces

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Generate SSL certificates for HTTPS development:
   ```bash
   npm run setup:certificates
   ```

4. Start the development server:
   
   npm start
   ```

5. Open [https://localhost:3000](https://localhost:3000) in your browser
   - **Note**: You'll see a security warning for the self-signed certificate - this is normal for development
   - Click "Advanced" → "Proceed to localhost" to continue

## Package Usage

### Core Engine

```typescript
import { sustainableAICalculator } from '@susai/core'

const result = sustainableAICalculator.calculateFromFormData({
  tokenCount: 1000,
  model: 'gpt-4',
  hardware: 'nvidia-a100',
  dataCenterProvider: 'google-cloud',
  dataCenterRegion: 'google-taiwan',
  contextLength: 8000,
  contextWindow: 1250
})
```

### Configuration

```typescript
import { aiModels, hardwareConfigs, dataCenterProviders } from '@susai/config'

// Access predefined configurations
const gpt4 = aiModels.find(model => model.id === 'gpt-4')
const a100 = hardwareConfigs.find(hw => hw.id === 'nvidia-a100')
```

### CLI Usage

```bash
# Calculate emissions for 1000 tokens
npx @sustainable-ai/cli calculate --tokens 1000 --model gpt-4

# List available models
npx @sustainable-ai/cli list --models

# List available hardware
npx @sustainable-ai/cli list --hardware

# List data centers
npx @sustainable-ai/cli list --datacenters
```

### API Server

```bash
# Start the API server
npm run dev --workspace=packages/api

# Health check
curl http://localhost:3001/api/health

# Calculate emissions
curl -X POST http://localhost:3001/api/calculation/calculate \
  -H "Content-Type: application/json" \
  -d '{"formData": {"tokenCount": 1000, "model": "gpt-4", ...}}'
```

## Available Scripts

### Root Level
- `npm run build` - Build all packages
- `npm run start` - Start dashboard with HTTPS
- `npm run test` - Run all tests
- `npm run lint` - Lint all packages
- `npm run typecheck` - Type check all packages

### Package Level
- `npm run dev --workspace=packages/api` - Start API server
- `npm run build --workspace=packages/core` - Build core package
- `npm run test --workspace=packages/cli` - Test CLI package

## HTTPS Development

This project requires HTTPS for proper WattTime API integration due to SSL certificate requirements. The development setup includes:

### SSL Certificates
- **Self-signed certificates** for localhost HTTPS development
- **Automatic generation** via `npm run setup:certificates`
- **Gitignored** for security (regenerated per environment)
- **Browser warnings** are normal for self-signed certificates

### Development Commands
```bash
# Generate SSL certificates (run once after cloning)
npm run setup:certificates

npm run start
```

### Browser Security Warning
When accessing `https://localhost:3000`, you'll see a security warning. This is expected for self-signed certificates:
1. Click "Advanced" or "Show Details"
2. Click "Proceed to localhost (unsafe)" or "Continue to this website"
3. The application will work normally

## API Integration

The platform integrates with multiple APIs for carbon intensity data:

- **WattTime API**: `https://api.watttime.org` - Real-time carbon intensity data
- **Electricity Maps API**: `https://portal.electricitymaps.com/developer-hub/api` - Regional carbon intensity data

## Development Guidelines

See [AGENTS.md](./AGENTS.md) for detailed development guidelines and project roadmap. The project follows sustainable coding practices to minimize environmental impact and promote long-term maintainability.

### Key Principles
- **Energy Efficiency**: Optimize API calls, implement caching, use efficient algorithms
- **Resource Optimization**: Minimize bundle size, optimize images, tree shaking
- **Performance**: Efficient state management, memoization, lazy loading
- **Code Quality**: Clean, maintainable code with comprehensive testing

## Testing

Run the test suite:

```bash
# Run all tests
npm run test

# Run tests for specific package
npm run test --workspace=packages/core
```

## Roadmap

The platform follows a prioritized roadmap:

1. ✅ **Settings** - WattTime API integration and user preferences
2. 🔄 **Dashboard** - Carbon intensity monitoring with visual indicators
3. 🔄 **Token Calculator** - AI model carbon footprint calculations
4. 🔄 **App Structure** - Navigation and layout improvements
5. 🔄 **API Server** - REST API for programmatic access
6. 🔄 **CLI Tool** - Command-line interface for CI/CD integration

## Contributing

1. Follow the coding standards defined in [AGENTS.md](./AGENTS.md)
2. Write tests for new features (maintain >80% coverage)
3. Ensure accessibility compliance (WCAG 2.1)
4. Test on both mobile and desktop
5. Follow sustainable coding practices

## License

This project is developed for sustainable AI development and carbon awareness in software engineering.