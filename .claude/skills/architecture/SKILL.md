---
name: innozverse-architecture
description: Understand the innozverse monorepo architecture, system design, technology choices, and development patterns. Use when designing features, understanding system structure, making architectural decisions, or planning cross-application changes.
---

# innozverse Architecture Skill

When working on the innozverse project, follow these architectural principles and patterns.

## System Overview

innozverse is a production-grade monorepo with three main applications:
- **Web** (Next.js 14 + TypeScript)
- **Mobile** (Flutter + Dart)
- **API** (Fastify + TypeScript, deployed to Fly.io)

## Key Architectural Decisions

### Monorepo Structure
- Use **Turborepo** for build orchestration
- **pnpm workspaces** for dependency management
- Shared packages in `packages/` for code reuse
- Clear separation between apps and packages

### Type Safety
- TypeScript for web and API with strict mode
- Dart for mobile with null safety
- Zod schemas for runtime validation
- Shared types in `@innozverse/shared` package

### API Design
- RESTful HTTP API with Fastify
- Versioned endpoints (`/v1`, `/v2`)
- Health check at `/health`
- CORS configured for web client
- Future: OpenAPI spec for codegen

### Data Flow
```
Mobile (Flutter) ──┐
                   ├──→ API (Fastify) → Fly.io
Web (Next.js) ─────┘
```

## Package Dependencies

### Dependency Graph
```
@innozverse/web
  └── @innozverse/api-client
        └── @innozverse/shared

@innozverse/api
  └── @innozverse/shared

@innozverse/mobile (Flutter)
  └── (mirrors types from shared, no direct dependency)
```

### Rules
- Packages should not depend on apps
- Apps can depend on packages
- Shared packages should have minimal dependencies
- Mobile mirrors TS types manually (for now)

## Technology Choices

### Web (Next.js)
- **Why**: SSR, great DX, React ecosystem
- **Router**: App Router (not Pages Router)
- **Styling**: Plain CSS (Tailwind can be added)
- **Data Fetching**: Client-side with API client

### API (Fastify)
- **Why**: Fast, TypeScript-first, lightweight
- **Deployment**: Fly.io (global edge, simple deploys)
- **Validation**: Zod schemas
- **CORS**: Configured for web origin

### Mobile (Flutter)
- **Why**: Single codebase for iOS + Android
- **HTTP Client**: `package:http`
- **Config**: `--dart-define` for environment vars

### Monorepo (Turborepo)
- **Why**: Efficient caching, simple pipeline config
- **Build**: Topological ordering of builds
- **Dev**: Parallel watch mode for fast iteration

## Scalability Considerations

### Current State
- Stateless API (horizontal scaling ready)
- No database yet (add PostgreSQL when needed)
- Single Fly.io region (can expand globally)

### Future Enhancements
1. Add database (PostgreSQL on Fly.io)
2. Implement authentication (JWT or OAuth)
3. Add caching layer (Redis)
4. Set up CDN for static assets
5. Implement rate limiting
6. Add monitoring (Sentry, DataDog)

## Security

### Environment Variables
- Never commit secrets
- Use `.env.example` for documentation
- Prefix client vars with `NEXT_PUBLIC_`

### API Security
- CORS configured for known origins
- HTTPS enforced in production (Fly.io)
- Input validation with Zod
- Health check doesn't expose sensitive info

### Type Safety as Security
- Prevents common bugs
- Catches errors at compile time
- Runtime validation with Zod

## Development Workflow

### Adding a New Feature

1. **API First** (if backend needed)
   - Add route in `apps/api/src/routes/v1/`
   - Define types in `@innozverse/shared`
   - Add endpoint to API client in `@innozverse/api-client`

2. **Web Integration**
   - Import from `@innozverse/api-client`
   - Use typed methods
   - Handle errors gracefully

3. **Mobile Integration**
   - Mirror types in Dart
   - Add method to `ApiService`
   - Update UI

### Adding a New Shared Package

```bash
mkdir packages/new-package
cd packages/new-package
pnpm init
```

- Name: `@innozverse/<name>`
- Extend base tsconfig from `@innozverse/config`
- Export from `src/index.ts`
- Build to `dist/`

## Performance

### Web
- Use Next.js Image optimization
- Implement code splitting
- Lazy load non-critical components

### API
- Minimize middleware overhead
- Use streaming for large responses
- Connection pooling for database

### Mobile
- Cache API responses locally
- Optimize images and assets
- Minimize network calls

## Testing Strategy (Future)

### Unit Tests
- Shared utilities and business logic
- API route handlers
- API client methods

### Integration Tests
- API endpoints end-to-end
- Web pages with API calls

### E2E Tests
- Critical user flows
- Cross-platform mobile testing

## Deployment

### API
- Fly.io via Docker
- Automatic health checks
- Zero-downtime deploys
- Secrets via `fly secrets`

### Web
- Vercel or similar
- Preview deployments for PRs
- Environment variables via platform

### Mobile
- Build with production API URL
- TestFlight (iOS) + Play Console (Android)
- Staged rollouts

## When to Break the Rules

- **Tight coupling**: Acceptable within an app, not between apps
- **Shared state**: Use database, not in-memory (API is stateless)
- **Synchronous calls**: Prefer async/await throughout
- **Direct DB access from web**: Never—always through API

## Resources

- [Architecture Docs](../docs/architecture.md)
- [Repository Conventions](../docs/conventions.md)
- [Fly.io Deployment](../docs/deployment-flyio.md)
- [API Contracts](../docs/contracts.md)
