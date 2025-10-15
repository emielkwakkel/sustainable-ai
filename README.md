# Sustainable AI Dashboard

A modern dashboard built with Nuxt.js 4 and Tailwind CSS for carbon-aware AI development, helping developers and organizations monitor and optimize their AI model usage for environmental sustainability.

## Features

- 🌱 **Carbon Aware Dashboard** - Real-time carbon intensity monitoring across multiple regions
- 🧮 **Token Calculator** - Calculate carbon emissions and energy consumption based on AI model token usage
- ⚙️ **WattTime Integration** - Connect to WattTime API for real-time carbon intensity data
- 📊 **Visual Indicators** - Color-coded tiles showing carbon intensity levels (red/orange/green)
- 📱 **Responsive design** for mobile and desktop
- ♿ **Accessibility compliant** (WCAG 2.1)
- 🧪 **Comprehensive testing** with Vitest

## Tech Stack

- **Framework**: Nuxt.js 4 (Vue.js 3)
- **Styling**: Tailwind CSS 4.1 with ChadCN components
- **Language**: TypeScript
- **Testing**: Vitest
- **APIs**: WattTime API, Electricity Maps API
- **State Management**: Nuxt's built-in useState
- **Icons**: Lucide Vue Next

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
   ```bash
   # For HTTP development
   npm run dev
   
   # For HTTPS development (recommended for WattTime API)
   npm run dev:https
   ```

5. Open [https://localhost:3000](https://localhost:3000) in your browser
   - **Note**: You'll see a security warning for the self-signed certificate - this is normal for development
   - Click "Advanced" → "Proceed to localhost" to continue

## Implementation Status

✅ **Completed Features:**
- Settings page with WattTime API integration
- User registration and authentication
- Secure token management with localStorage
- Application preferences (dark mode, auto-refresh)
- Form validation with real-time feedback
- Connection status monitoring
- Responsive design with Tailwind CSS
- TypeScript type safety
- Component-based architecture
- Comprehensive testing suite

### Current Functionality
- **Settings Management**:
  - WattTime account registration and login
  - Secure token storage and expiration handling
  - Connection status with visual indicators
  - Application preferences with persistence
- **Form Validation**:
  - Real-time email and password validation
  - Comprehensive error messaging
  - Loading states and user feedback
- **Responsive Design**:
  - Mobile-first approach
  - Dark/light mode support
  - Accessible UI components

### Available Scripts

- `npm run dev` - Start development server (HTTP)
- `npm run dev:https` - Start development server (HTTPS) - **Recommended for WattTime API**
- `npm run setup:certificates` - Generate SSL certificates for HTTPS development
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

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

# Start HTTPS development server (recommended)
npm run dev:https

# Start HTTP development server (limited API functionality)
npm run dev
```

### Browser Security Warning
When accessing `https://localhost:3000`, you'll see a security warning. This is expected for self-signed certificates:
1. Click "Advanced" or "Show Details"
2. Click "Proceed to localhost (unsafe)" or "Continue to this website"
3. The application will work normally

## API Integration

The dashboard integrates with multiple APIs for carbon intensity data:

- **WattTime API**: `https://api.watttime.org` - Real-time carbon intensity data
- **Electricity Maps API**: `https://portal.electricitymaps.com/developer-hub/api` - Regional carbon intensity data

## Project Structure

```
/
├── components/          # Reusable Vue components
├── composables/         # Vue composables for logic (API, token management, preferences)
├── pages/              # Nuxt pages (settings, dashboard, calculator)
├── types/              # TypeScript type definitions (WattTime, weather, preferences)
├── utils/              # Utility functions (form validation, helpers)
├── assets/             # Static assets and CSS
├── public/             # Public assets
├── certs/              # SSL certificates for HTTPS development (gitignored)
├── server/             # Nuxt server API routes (WattTime proxy)
├── test/               # Test files and setup
├── .cursor/            # Cursor AI rules and guidelines
└── AGENTS.md          # Agent guidelines and project documentation
```

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
npm run test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Roadmap

The project follows a prioritized roadmap:

1. ✅ **Settings** - WattTime API integration and user preferences
2. 🔄 **Dashboard** - Carbon intensity monitoring with visual indicators
3. 🔄 **Token Calculator** - AI model carbon footprint calculations
4. 🔄 **App Structure** - Navigation and layout improvements

## Contributing

1. Follow the coding standards defined in [AGENTS.md](./AGENTS.md)
2. Write tests for new features (maintain >80% coverage)
3. Ensure accessibility compliance (WCAG 2.1)
4. Test on both mobile and desktop
5. Follow sustainable coding practices

## License

This project is developed for sustainable AI development and carbon awareness in software engineering.
