# innozverse

Production-grade monorepo containing web, mobile, and API applications.

## Architecture

- **Web App**: Next.js with TypeScript (App Router)
- **Mobile App**: Flutter (iOS + Android)
- **API**: Fastify server deployed to Fly.io
- **Shared Packages**: Type-safe contracts and API clients

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Flutter SDK 3.10.4+ (for mobile development)

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment files
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
```

### Development

**Run web + API together:**
```bash
pnpm dev
```

This starts:
- Web app: http://localhost:3000
- API server: http://localhost:8080

**Run individually:**
```bash
# Web only
pnpm dev:web

# API only
pnpm dev:api
```

**Run mobile app:**
```bash
cd apps/mobile
flutter pub get
flutter run
```

See [apps/mobile/README.md](./apps/mobile/README.md) for mobile-specific instructions.

## Project Structure

```
innozverse/
├── apps/
│   ├── web/              # Next.js web application
│   ├── api/              # Fastify API server
│   └── mobile/           # Flutter mobile app
├── packages/
│   ├── shared/           # Shared types and schemas
│   ├── api-client/       # Typed API client
│   └── config/           # Shared configs (ESLint, TypeScript)
├── docs/                 # Documentation
└── .claude/              # Claude AI skills
```

## Available Scripts

- `pnpm dev` - Start web + API in development mode
- `pnpm build` - Build all packages and apps
- `pnpm lint` - Lint all packages and apps
- `pnpm format` - Format code with Prettier
- `pnpm test` - Run all tests
- `pnpm typecheck` - Type check all TypeScript code
- `pnpm clean` - Clean all build artifacts

## Documentation

- [Architecture Overview](./docs/architecture.md)
- [Repository Conventions](./docs/conventions.md)
- [Deployment to Fly.io](./docs/deployment-flyio.md)
- [API Contracts & Codegen](./docs/contracts.md)

## Deployment

### API to Fly.io

See [docs/deployment-flyio.md](./docs/deployment-flyio.md) for detailed instructions.

Quick deploy:
```bash
cd apps/api
fly launch  # First time only
fly deploy  # Subsequent deploys
```

### Web App

Deploy to Vercel, Netlify, or any Next.js-compatible platform:

```bash
cd apps/web
pnpm build
```

### Mobile App

Build for production:

```bash
cd apps/mobile
flutter build ios --dart-define=API_BASE_URL=https://your-api.fly.dev
flutter build apk --dart-define=API_BASE_URL=https://your-api.fly.dev
```

## Tech Stack

### Web
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS (optional, can be added)

### API
- Fastify
- TypeScript
- Zod (validation)

### Mobile
- Flutter 3.10+
- Dart
- HTTP package

### Tooling
- Turborepo (monorepo orchestration)
- pnpm (package management)
- ESLint + Prettier (code quality)
- GitHub Actions (CI/CD)

## Contributing

1. Create a feature branch
2. Make your changes
3. Run `pnpm lint` and `pnpm typecheck`
4. Submit a pull request

## License

Private - All rights reserved
