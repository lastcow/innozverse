# innozverse Setup Complete! ✅

The innozverse monorepo has been successfully scaffolded.

## What Was Created

### ✅ Root Configuration
- `package.json` - Root scripts and workspace config
- `pnpm-workspace.yaml` - Workspace definition
- `turbo.json` - Turborepo pipelines
- `.gitignore` - Git ignore rules
- `.editorconfig` - Editor configuration
- `.prettierrc` - Prettier formatting rules
- `.github/workflows/ci.yml` - CI/CD pipeline

### ✅ Shared Packages

**packages/config**
- Shared ESLint and TypeScript configurations
- Used by all TypeScript projects

**packages/shared**
- Domain types (`HealthResponse`, `ApiError`)
- Zod validation schemas
- Shared constants
- Exports: `@innozverse/shared`

**packages/api-client**
- Typed HTTP client for web app
- Uses fetch API
- Runtime validation with Zod
- Exports: `@innozverse/api-client`

### ✅ Applications

**apps/api (Fastify)**
- Health check endpoint: `GET /health`
- Versioned routes: `/v1/`
- Dockerfile for Fly.io deployment
- `fly.toml` configuration
- Environment: `.env.example`

**apps/web (Next.js 14)**
- App Router setup
- Health check demo page
- Uses `@innozverse/api-client`
- Environment: `.env.example`
- Ready for `pnpm dev`

**apps/mobile (Flutter)**
- iOS + Android scaffold
- API service with health check
- Environment via `--dart-define`
- Material Design 3 UI
- Ready for `flutter run`

### ✅ Documentation

**Root README.md** - Project overview and quick start

**docs/**
- `architecture.md` - System architecture
- `conventions.md` - Coding conventions
- `deployment-flyio.md` - Fly.io deployment guide
- `contracts.md` - API contracts strategy

### ✅ Claude Skills

**.claude/skills/**
- `architecture.md` - Architecture principles
- `repo-structure.md` - Repository organization
- `api-style.md` - API development patterns
- `web-style.md` - Web development patterns
- `flutter-style.md` - Mobile development patterns
- `flyio-deploy.md` - Deployment quick reference
- `testing-quality.md` - Quality standards

## Next Steps

### 1. Install Dependencies (Already Done ✅)

Dependencies have been installed. If you need to reinstall:
```bash
pnpm install
```

### 2. Set Up Environment Variables

**Web App:**
```bash
cd apps/web
cp .env.example .env.local
# Edit .env.local and set NEXT_PUBLIC_API_BASE_URL
```

**API:**
```bash
cd apps/api
cp .env.example .env
# Edit .env if needed
```

### 3. Start Development

**Option A: Start Web + API Together**
```bash
pnpm dev
```

This starts:
- Web: http://localhost:3000
- API: http://localhost:8080

**Option B: Start Individually**
```bash
# Terminal 1 - API
pnpm dev:api

# Terminal 2 - Web
pnpm dev:web
```

**Option C: Mobile App**
```bash
cd apps/mobile
flutter pub get
flutter run
```

### 4. Verify Setup

**Test API:**
```bash
curl http://localhost:8080/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

**Test Web:**
1. Open http://localhost:3000
2. Click "Check API Health"
3. Should display API health status

**Test Mobile:**
1. Start iOS simulator or Android emulator
2. Run `flutter run` from `apps/mobile/`
3. Tap "Check Health" button
4. Should display API health status

### 5. Build Everything

```bash
pnpm build
```

This builds all packages and apps.

### 6. Lint and Type Check

```bash
pnpm lint
pnpm typecheck
```

## Project Structure

```
innozverse/
├── apps/
│   ├── web/              # Next.js web app
│   ├── api/              # Fastify API server
│   └── mobile/           # Flutter mobile app
├── packages/
│   ├── shared/           # Shared types & schemas
│   ├── api-client/       # Typed API client
│   └── config/           # Shared configs
├── docs/                 # Documentation
├── .claude/skills/       # Claude AI skills
└── .github/workflows/    # CI/CD pipelines
```

## Available Commands

### Root Level
- `pnpm dev` - Start web + API
- `pnpm dev:web` - Start web only
- `pnpm dev:api` - Start API only
- `pnpm build` - Build all packages/apps
- `pnpm lint` - Lint all code
- `pnpm format` - Format with Prettier
- `pnpm typecheck` - Type check TypeScript
- `pnpm test` - Run all tests
- `pnpm clean` - Clean build artifacts

### Individual Packages
Each package has:
- `pnpm dev` - Development mode
- `pnpm build` - Build package
- `pnpm lint` - Lint package
- `pnpm typecheck` - Type check

## Deployment

### API to Fly.io

See [docs/deployment-flyio.md](./docs/deployment-flyio.md) for full guide.

Quick deploy:
```bash
cd apps/api
fly launch      # First time
fly deploy      # Subsequent deploys
```

### Web to Vercel

```bash
cd apps/web
pnpm build
# Deploy to Vercel via their CLI or GitHub integration
```

### Mobile

```bash
cd apps/mobile
flutter build ios --dart-define=API_BASE_URL=https://your-api.fly.dev
flutter build apk --dart-define=API_BASE_URL=https://your-api.fly.dev
```

## Tech Stack Summary

| Component | Technology |
|-----------|-----------|
| Web | Next.js 14, React 18, TypeScript |
| API | Fastify, TypeScript, Zod |
| Mobile | Flutter 3.10+, Dart |
| Monorepo | Turborepo, pnpm workspaces |
| Deployment | Fly.io (API), Vercel (Web) |
| CI/CD | GitHub Actions |
| Linting | ESLint, Prettier, flutter_lints |

## Troubleshooting

### Port Already in Use

If port 3000 or 8080 is in use:
```bash
# Find and kill process on port
lsof -ti:3000 | xargs kill -9
lsof -ti:8080 | xargs kill -9
```

### Flutter Dependencies

```bash
cd apps/mobile
flutter pub get
```

### TypeScript Build Errors

```bash
pnpm clean
pnpm install
pnpm build
```

### Linting Errors

```bash
pnpm format
pnpm lint
```

## Documentation

- [Main README](./README.md)
- [Architecture](./docs/architecture.md)
- [Conventions](./docs/conventions.md)
- [Deployment](./docs/deployment-flyio.md)
- [API Contracts](./docs/contracts.md)

## Getting Help

- Check documentation in `docs/`
- Review Claude skills in `.claude/skills/`
- Check GitHub issues
- Review Turborepo docs: https://turbo.build/
- Review Fastify docs: https://www.fastify.io/
- Review Next.js docs: https://nextjs.org/
- Review Flutter docs: https://flutter.dev/

## What's Next?

1. **Add Authentication** - Implement JWT or OAuth
2. **Add Database** - PostgreSQL on Fly.io
3. **Add More Endpoints** - Build out your API
4. **Add Tests** - Implement test coverage
5. **Set Up OpenAPI** - Generate API clients
6. **Add Monitoring** - Sentry, analytics, etc.

---

🎉 **You're all set! Start building with `pnpm dev`**
