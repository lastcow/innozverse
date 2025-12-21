# innozverse Architecture

## Overview

innozverse is a production-grade monorepo containing three main applications that share common types and utilities.

## System Components

### 1. Web Application (`apps/web`)

**Technology**: Next.js 14 with App Router, TypeScript

**Purpose**: Primary web interface for users

**Key Features**:
- Server-side rendering (SSR) and static generation
- React 18 with modern hooks
- Typed API client from `@innozverse/api-client`
- Environment-based configuration

**Structure**:
```
apps/web/
├── src/
│   └── app/
│       ├── layout.tsx    # Root layout
│       ├── page.tsx      # Home page
│       └── globals.css   # Global styles
├── next.config.js
└── .env.example
```

### 2. API Server (`apps/api`)

**Technology**: Fastify, TypeScript

**Purpose**: Backend API deployed to Fly.io

**Key Features**:
- Fast, lightweight HTTP server
- Versioned API routes (`/v1/...`)
- Health check endpoint
- CORS enabled for web client
- Production-ready Dockerfile

**Structure**:
```
apps/api/
├── src/
│   ├── index.ts          # Server entry point
│   └── routes/
│       ├── health.ts     # Health check
│       └── v1/           # Versioned API routes
├── Dockerfile
└── fly.toml
```

**Endpoints**:
- `GET /health` - Health check
- `GET /v1/` - API v1 root

### 3. Mobile Application (`apps/mobile`)

**Technology**: Flutter (Dart)

**Purpose**: Native iOS and Android applications

**Key Features**:
- Single codebase for iOS + Android
- HTTP-based API client
- Environment configuration via `--dart-define`
- Material Design 3

**Structure**:
```
apps/mobile/
├── lib/
│   ├── main.dart         # App entry point
│   └── services/
│       └── api_service.dart  # API client
├── pubspec.yaml
└── README.md
```

## Shared Packages

### 1. `@innozverse/shared`

**Purpose**: Domain types, Zod schemas, and constants shared across TypeScript projects

**Exports**:
- `HealthResponse` - Health check response type
- `ApiError` - Error response type
- `healthResponseSchema` - Zod validation schema
- `ROUTES` - API route constants

### 2. `@innozverse/api-client`

**Purpose**: Typed HTTP client for consuming the API from web

**Features**:
- Strongly typed methods
- Runtime validation with Zod
- Error handling
- Re-exports types from `@innozverse/shared`

**Usage**:
```typescript
import { ApiClient } from '@innozverse/api-client';

const client = new ApiClient('http://localhost:8080');
const health = await client.getHealth();
```

### 3. `@innozverse/config`

**Purpose**: Shared ESLint and TypeScript configurations

**Provides**:
- `tsconfig.base.json` - Base TypeScript config
- `eslint-preset.js` - ESLint rules

## Data Flow

```
┌─────────────┐
│   Mobile    │
│   (Flutter) │
└─────┬───────┘
      │
      │ HTTP
      ↓
┌─────────────┐      ┌──────────────┐
│    Web      │      │   API Server │
│  (Next.js)  │─────→│  (Fastify)   │
└─────────────┘ HTTP └──────────────┘
                           │
                           ↓
                    [Fly.io Platform]
```

1. **Web and Mobile** make HTTP requests to the API
2. **API** validates requests and returns typed responses
3. **Web** uses `@innozverse/api-client` for type safety
4. **Mobile** uses Flutter's HTTP client and mirrors the types in Dart

## Environment Configuration

### Web (`apps/web`)
- `NEXT_PUBLIC_API_BASE_URL` - API endpoint (client-side)

### API (`apps/api`)
- `PORT` - Server port (default: 8080)
- `NODE_ENV` - Environment (development/production)
- `API_VERSION` - Version string for health endpoint
- `CORS_ORIGIN` - CORS allowed origins

### Mobile (`apps/mobile`)
- `API_BASE_URL` - Via `--dart-define` flag (default: http://localhost:8080)

## Deployment Architecture

### Development
- Web: http://localhost:3000
- API: http://localhost:8080
- Mobile: Uses localhost (iOS) or 10.0.2.2 (Android emulator)

### Production
- Web: Vercel / Netlify / similar
- API: Fly.io (https://innozverse-api.fly.dev)
- Mobile: Built with production API URL via `--dart-define`

## Security Considerations

1. **CORS**: API configured to accept requests from web origin
2. **Environment Variables**: Secrets never committed; use `.env.local` files
3. **HTTPS**: Enforced in production via Fly.io configuration
4. **Input Validation**: Zod schemas validate API responses on the client
5. **Type Safety**: End-to-end TypeScript types prevent common errors

## Scalability

### Current State
- Minimal, production-ready scaffold
- Single API instance on Fly.io
- Stateless design allows horizontal scaling

### Future Enhancements
- Add database (PostgreSQL on Fly.io)
- Implement authentication (JWT, OAuth)
- Add caching layer (Redis)
- Set up CDN for static assets
- Implement rate limiting
- Add monitoring and observability (Sentry, DataDog)

## Technology Decisions

### Why Turborepo?
- Efficient caching across packages
- Simple pipeline configuration
- Great monorepo developer experience

### Why Fastify?
- Fast and lightweight
- TypeScript-first with good type inference
- Excellent plugin ecosystem
- Well-suited for Fly.io deployment

### Why Flutter?
- Single codebase for iOS + Android
- High performance native apps
- Rich widget library
- Strong typing with Dart

### Why Fly.io?
- Simple deployment workflow
- Global edge network
- Built-in health checks and scaling
- Great for containerized Node.js apps

## Next Steps

1. Add authentication system
2. Implement database layer
3. Create OpenAPI spec for API
4. Set up Dart codegen from OpenAPI
5. Add comprehensive test coverage
6. Implement feature flags
7. Add monitoring and alerting
