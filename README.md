# Sustainable AI Platform

A comprehensive platform for carbon-aware AI development, helping developers and organizations monitor and optimize their AI model usage for environmental sustainability.

## Platform Overview

The Sustainable AI Platform is a modular ecosystem consisting of:

- **🌐 Dashboard** - Web interface for carbon intensity monitoring and calculations
- **🧮 Core Engine** - Calculation engine for carbon emissions and energy consumption
- **⚙️ Configuration** - PUE data, AI models, hardware configurations, and pricing models
- **🔌 API Server** - REST API for programmatic access
- **💻 CLI Tool** - Command-line interface for CI/CD integration
- **💬 Token Simulator** - Multi-agent conversation simulation with token tracking
- **📦 Shared Types** - TypeScript definitions across all packages

## Architecture

```
sustainable-ai-platform/
├── packages/
│   ├── core/                    # Core calculation engine & tokenizer
│   ├── config/                  # Configuration, PUE data, and pricing models
│   ├── api/                     # REST API server with PostgreSQL database
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

### 💬 Token Simulator
- Simulate single-agent and multi-agent conversations with manual token tracking
- Create and manage multiple chat sessions with custom agent configurations
- Add multiple rounds of prompts and responses for each agent
- Real-time token counting using `js-tiktoken` for accurate token calculation
- Cumulative token tracking across rounds (input includes all past answers from previous rounds)
- Multi-agent token calculation: (single-agent input + total output) × number of agents per round
- Cost calculation for GPT-4o, GPT-4.1, and GPT-5 with separate input/output pricing:
  - **GPT-4o**: Input $2.50/1M, Output $10.00/1M tokens
  - **GPT-4.1**: Input $2.00/1M, Output $8.00/1M tokens
  - **GPT-5**: Input $1.25/1M, Output $10.00/1M tokens
- Visual summary showing input tokens, output tokens, and costs per model
- Persistent storage in PostgreSQL database
- RESTful API endpoints for programmatic access

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
- **Database**: PostgreSQL (for Token Simulator data persistence)
- **APIs**: WattTime API, Electricity Maps API
- **State Management**: Nuxt's built-in useState
- **Icons**: Lucide Vue Next
- **Tokenization**: js-tiktoken for accurate token counting
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
import { aiModels, hardwareConfigs, dataCenterProviders, modelPricing } from '@susai/config'

// Access predefined configurations
const gpt4 = aiModels.find(model => model.id === 'gpt-4')
const a100 = hardwareConfigs.find(hw => hw.id === 'nvidia-a100')

// Access pricing models
const gpt4oPricing = modelPricing.find(p => p.model === 'gpt-4o')
```

### Token Simulator

```typescript
import { countTokens, calculateCost } from '@susai/core'

// Count tokens in text
const tokenCount = countTokens('Hello, world!', 'gpt-4')

// Calculate costs for a conversation
const costResult = calculateCost(
  1000,  // inputTokens
  500,   // outputTokens
  'gpt-4o'  // model
)
// Returns: { inputCost, outputCost, totalCost, model }
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

# Token Simulator endpoints
# Get all chats
curl http://localhost:3001/api/token-simulator/chats?user_id=<user_id>

# Create a new chat
curl -X POST http://localhost:3001/api/token-simulator/chats \
  -H "Content-Type: application/json" \
  -d '{"name": "My Chat", "user_id": "<user_id>"}'

# Add a round to a chat
curl -X POST http://localhost:3001/api/token-simulator/chats/<chat_id>/rounds \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello", "responses": [{"agent_id": "<agent_id>", "response_text": "Hi there!"}]}'
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
2. ✅ **Dashboard** - Carbon intensity monitoring with visual indicators
3. ✅ **Token Calculator** - AI model carbon footprint calculations
4. ✅ **App Structure** - Navigation and layout improvements
5. ✅ **API Server** - REST API for programmatic access
6. ✅ **CLI Tool** - Command-line interface for CI/CD integration
7. ✅ **Token Simulator** - Multi-agent conversation simulation with token tracking and cost calculation

## Contributing

1. Follow the coding standards defined in [AGENTS.md](./AGENTS.md)
2. Write tests for new features (maintain >80% coverage)
3. Ensure accessibility compliance (WCAG 2.1)
4. Test on both mobile and desktop
5. Follow sustainable coding practices

## Notes
- 21/10: Spent mostly on fixing NX monorepository structure, Cursor seems unable to fully get all packages to work together
- 22/10: Manual fixes to NX monorepository structure

## License

This project is developed for sustainable AI development and carbon awareness in software engineering.