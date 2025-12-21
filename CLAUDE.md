# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

innozverse is a production-grade TypeScript monorepo using Turborepo and pnpm workspaces. It contains three applications (web, API, mobile) with shared packages for type-safe contracts across the entire stack.

**Tech Stack:**
- **Monorepo**: Turborepo v1.11.2 + pnpm v8.15.0
- **Web**: Next.js 14 (App Router) + React 18
- **API**: Fastify (deployed to Fly.io)
- **Mobile**: Flutter 3.10+ (Dart)
- **Validation**: Zod schemas for runtime type safety
- **Language**: TypeScript 5.3.3 with strict mode

## Essential Commands

### Development
```bash
# Start web + API together (excludes mobile)
pnpm dev

# Start individual apps
pnpm dev:web      # Web only (http://localhost:3000)
pnpm dev:api      # API only (http://localhost:8080)

# Mobile (must be run from apps/mobile directory)
cd apps/mobile
flutter pub get
flutter run
```

### Building & Testing
```bash
# Build all packages and apps (respects dependency graph)
pnpm build

# Type checking across entire monorepo
pnpm typecheck

# Linting
pnpm lint

# Format code with Prettier
pnpm format
pnpm format:check

# Tests (when implemented)
pnpm test

# Clean all build artifacts
pnpm clean
```

### Working with Individual Packages
```bash
# Run command in specific workspace
pnpm --filter=@innozverse/web dev
pnpm --filter=@innozverse/api build
pnpm --filter=@innozverse/shared typecheck
```

## Architecture

### Monorepo Structure

```
innozverse/
├── apps/
│   ├── web/              # Next.js web application
│   ├── api/              # Fastify API server
│   └── mobile/           # Flutter mobile app
├── packages/
│   ├── shared/           # Domain types and Zod schemas
│   ├── api-client/       # Typed HTTP client for web
│   └── config/           # Shared ESLint and TypeScript configs
└── docs/                 # Architecture, conventions, deployment guides
```

### Shared Packages: The Type-Safety Foundation

The shared packages establish end-to-end type safety across the stack. Understanding their relationships is critical:

**packages/shared** - Single source of truth for all domain types
- Contains TypeScript interfaces AND Zod schemas for each domain concept
- Exports constants like `API_VERSION`, `DEFAULT_API_PORT`, `ROUTES`
- Pattern: Each type has both a TS interface (compile-time) and Zod schema (runtime validation)
- Example: `HealthResponse` interface + `healthResponseSchema` for validation

**packages/api-client** - Type-safe HTTP client
- Generic `request<T>()` method with error handling and validation
- One method per API endpoint (e.g., `getHealth()`)
- Performs runtime validation using shared Zod schemas
- Re-exports all types from `@innozverse/shared` for convenience
- Used by web app to consume the API with full type safety

**packages/config** - Shared build configuration
- `tsconfig.base.json` - Base TypeScript config (ES2022, strict mode)
- `eslint-preset.js` - Shared ESLint rules
- All packages extend these configs for consistency

### How Type Safety Flows Across the Stack

```
1. Define in packages/shared:
   - interface HealthResponse { ... }
   - healthResponseSchema = z.object({ ... })

2. API (apps/api) uses the types:
   - Returns JSON matching HealthResponse shape
   - Route handler typed with Fastify generics

3. API Client (packages/api-client) validates:
   - async getHealth(): Promise<HealthResponse> {
       const data = await this.request<HealthResponse>('/health');
       return healthResponseSchema.parse(data);  // Runtime validation!
     }

4. Web app (apps/web) consumes:
   - const health = await apiClient.getHealth();
   - Fully typed as HealthResponse, validated at runtime
```

**Key Insight**: The Zod schemas in `@innozverse/shared` enable both compile-time type checking AND runtime validation, catching mismatches between frontend and backend.

### API Architecture (apps/api)

**Route Organization:**
- Fastify uses plugin-based route registration
- Routes are in `src/routes/` directory
- Versioned routes use prefix: `fastify.register(v1Routes, { prefix: '/v1' })`
- Each route group is an async function that registers routes on the Fastify instance

**Key Patterns:**
- Environment configuration via `.env` (PORT, CORS_ORIGIN, LOG_LEVEL, API_VERSION)
- CORS enabled via `@fastify/cors` plugin
- Type-safe route handlers using Fastify's generic types
- Minimal, production-ready server suitable for Fly.io deployment

**Current Endpoints:**
- `GET /health` - Health check (returns HealthResponse)
- `GET /v1/` - API v1 root
- `POST /v1/auth/register` - Register with email/password
- `POST /v1/auth/login` - Login with email/password
- `POST /v1/auth/refresh` - Refresh access token
- `GET /v1/auth/me` - Get current user (protected)
- `POST /v1/auth/logout` - Logout
- `GET /v1/auth/google` - Initiate Google OAuth
- `GET /v1/auth/google/callback` - Google OAuth callback
- `GET /v1/auth/github` - Initiate GitHub OAuth
- `GET /v1/auth/github/callback` - GitHub OAuth callback

### Web App Architecture (apps/web)

**Next.js 14 with App Router:**
- Modern file-based routing in `src/app/` directory
- `layout.tsx` - Server component with root layout and metadata
- `page.tsx` - Client component using React hooks and ApiClient
- Uses `'use client'` directive for client-side data fetching

**API Integration Pattern:**
```typescript
// Single ApiClient instance at module level
const apiClient = new ApiClient(
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'
);

// In component:
const [health, setHealth] = useState<HealthResponse | null>(null);
const response = await apiClient.getHealth();
```

**Key Configuration:**
- `transpilePackages: ['@innozverse/api-client', '@innozverse/shared']` - Required to bundle TypeScript-only workspace packages
- `NEXT_PUBLIC_API_BASE_URL` environment variable for runtime API location
- Simple useState-based state management (no global state library)

### Mobile App (Flutter)

**Note**: Mobile app manually mirrors TypeScript types in Dart. There's no automatic synchronization currently.

**Future**: See `docs/contracts.md` for planned OpenAPI-based code generation to keep TypeScript and Dart types in sync.

## Environment Variables

### Web (apps/web)
```bash
# .env.local (not committed)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080  # Client-side API endpoint
```

### API (apps/api)
```bash
# .env (not committed)
PORT=8080
HOST=0.0.0.0
NODE_ENV=development
API_VERSION=1.0.0
API_URL=http://localhost:8080
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info

# Database Configuration (DigitalOcean PostgreSQL)
DATABASE_URL=postgresql://doadmin:password@host:25060/dev?sslmode=require
DB_HOST=db-postgresql-nyc3-49175-do-user-7082011-0.j.db.ondigitalocean.com
DB_PORT=25060
DB_NAME=dev
DB_USER=doadmin
DB_PASSWORD=<your-password>
DB_SSL=true

# JWT Configuration
JWT_SECRET=<generated-with-openssl-rand-base64-32>
JWT_REFRESH_SECRET=<different-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OAuth State Security (CSRF Protection)
OAUTH_STATE_SECRET=<another-secret>

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# GitHub OAuth (optional)
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret

# Web App URL (for OAuth redirects)
WEB_APP_URL=http://localhost:3000
```

**Note**: The actual database credentials and JWT secrets are already configured in `apps/api/.env`. Never commit this file to version control.

**Generate secrets:** Use `openssl rand -base64 32` to generate secure random secrets.

### Mobile (apps/mobile)
```bash
# Passed via --dart-define flag
flutter run --dart-define=API_BASE_URL=http://localhost:8080
```

**Important**: Always update `.env.example` files when adding new environment variables.

## Code Conventions

### TypeScript Style
- **Formatting**: Prettier with 2-space indentation, single quotes, semicolons required
- **Naming**:
  - Variables/functions: `camelCase`
  - Types/interfaces: `PascalCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Files: `kebab-case.ts` (components: `PascalCase.tsx`)
- **Response types**: Suffix with `Response` (e.g., `HealthResponse`)
- **Error types**: Suffix with `Error` (e.g., `ApiError`)

### Commit Messages
Format: `type(scope): description`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
```
feat(api): add user authentication endpoint
fix(web): resolve infinite loop in health check
docs(readme): add deployment instructions
```

### Workspace Dependencies
- Internal packages: `"@innozverse/shared": "workspace:*"`
- External packages: Pin or use caret ranges `"react": "^18.2.0"`

## Adding New Features

### Adding a New API Endpoint

1. **Define types in packages/shared:**
   ```typescript
   // packages/shared/src/types.ts
   export interface UserResponse {
     id: string;
     name: string;
     email: string;
   }

   // packages/shared/src/schemas.ts
   export const userResponseSchema = z.object({
     id: z.string(),
     name: z.string(),
     email: z.string().email()
   });
   ```

2. **Add route in apps/api:**
   ```typescript
   // apps/api/src/routes/v1/users.ts
   export async function userRoutes(fastify: FastifyInstance) {
     fastify.get<{ Reply: UserResponse }>('/users/:id', async (request, reply) => {
       // Implementation
     });
   }

   // Register in apps/api/src/routes/v1/index.ts
   fastify.register(userRoutes);
   ```

3. **Add method in packages/api-client:**
   ```typescript
   // packages/api-client/src/index.ts
   async getUser(id: string): Promise<UserResponse> {
     const data = await this.request<UserResponse>(`/v1/users/${id}`);
     return userResponseSchema.parse(data);
   }
   ```

4. **Use in web app:**
   ```typescript
   const user = await apiClient.getUser('123');
   // Fully typed and validated!
   ```

### Adding a Shared Package

1. Create directory: `packages/new-package/`
2. Add `package.json` with name `@innozverse/new-package`
3. Extend base configs from `@innozverse/config`
4. Add to `pnpm-workspace.yaml` if needed (already includes `packages/*`)
5. Run `pnpm install` to link workspace packages

## Database

### Database Setup

The API is connected to a **DigitalOcean PostgreSQL database**. The connection is automatically tested on server startup.

**Connection Details:**
- **Provider**: DigitalOcean Managed PostgreSQL
- **Location**: NYC3 region
- **SSL**: Required (enabled by default)
- **Connection Pool**: Managed by `pg` library (max 20 connections)

**Key Files:**
- `apps/api/src/db/index.ts` - Database connection pool and utilities
- `apps/api/.env` - Database credentials (not committed)
- `apps/api/.env.example` - Template with placeholder values

### Using the Database

**Import the pool:**
```typescript
import { pool } from '../db';

// Query example
const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
const user = result.rows[0];
```

**Best Practices:**
1. **Use parameterized queries** - Always use `$1, $2, etc.` placeholders to prevent SQL injection:
   ```typescript
   // Good - parameterized
   await pool.query('SELECT * FROM users WHERE email = $1', [email]);

   // Bad - vulnerable to SQL injection
   await pool.query(`SELECT * FROM users WHERE email = '${email}'`);
   ```

2. **Handle connections properly**:
   ```typescript
   // For simple queries, use pool.query() directly
   const result = await pool.query('SELECT NOW()');

   // For transactions, get a client from the pool
   const client = await pool.connect();
   try {
     await client.query('BEGIN');
     await client.query('INSERT INTO users...');
     await client.query('INSERT INTO profiles...');
     await client.query('COMMIT');
   } catch (e) {
     await client.query('ROLLBACK');
     throw e;
   } finally {
     client.release(); // Always release the client back to the pool
   }
   ```

3. **Test the connection** - The server automatically tests the database connection on startup and logs the result.

### Database Migrations

Migrations are stored in `apps/api/migrations/` and must currently be run manually using `psql`.

**Running migrations:**
```bash
# Connect to database
psql postgresql://doadmin:password@host:25060/dev?sslmode=require

# Run a migration
\i apps/api/migrations/001_create_users_table.sql
\i apps/api/migrations/002_create_oauth_providers_table.sql
```

**Current migrations:**
- `001_create_users_table.sql` - Users table with authentication fields
- `002_create_oauth_providers_table.sql` - OAuth providers table for Google/GitHub

**Future**: Consider adding an automated migration tool like `node-pg-migrate` or `knex`

## Authentication & Authorization

innozverse has a production-ready authentication system with JWT tokens and OAuth support (Google, GitHub).

### Overview

**Authentication Methods:**
- Email/password with bcrypt hashing
- Google OAuth 2.0
- GitHub OAuth 2.0

**Security Features:**
- JWT access tokens (15-minute expiry)
- Refresh tokens (7-day expiry)
- OAuth state parameter (CSRF protection)
- Email normalization (prevents duplicate accounts)
- Password accounts can't use OAuth login and vice versa
- Database transactions for atomic operations
- Email verification check before OAuth linking

### Database Schema

**Users Table** (`users`):
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,     -- Normalized to lowercase
  password_hash VARCHAR(255),              -- Nullable for OAuth-only accounts
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,                         -- From OAuth or user upload
  role VARCHAR(50) DEFAULT 'user',         -- 'user' or 'admin'
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMP,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**OAuth Providers Table** (`oauth_providers`):
```sql
CREATE TABLE oauth_providers (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,           -- 'google' or 'github'
  provider_user_id VARCHAR(255) NOT NULL,
  provider_email VARCHAR(255),
  provider_name VARCHAR(255),
  provider_avatar_url TEXT,
  access_token TEXT,                       -- OAuth access token
  refresh_token TEXT,                      -- OAuth refresh token
  token_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider, provider_user_id)       -- One OAuth account per user
);
```

### Environment Variables

Add these to `apps/api/.env`:

```bash
# JWT Configuration
JWT_SECRET=<generated-with-openssl-rand-base64-32>
JWT_REFRESH_SECRET=<different-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OAuth State Security (CSRF Protection)
OAUTH_STATE_SECRET=<another-secret>

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# GitHub OAuth (optional)
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret

# Web App URL (for OAuth redirects)
WEB_APP_URL=http://localhost:3000
```

**Generate secrets:**
```bash
openssl rand -base64 32
```

### Using Authentication in the API

**Import auth utilities:**
```typescript
import { requireAuth, requireRole } from '../middleware/auth';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { hashPassword, comparePassword } from '../utils/password';
import { normalizeEmail } from '../utils/email';
```

**Protected routes:**
```typescript
// Require authentication
fastify.get('/protected', {
  preHandler: requireAuth
}, async (request, reply) => {
  // request.user contains: { userId, email, role }
  const userId = request.user!.userId;
  // ...
});

// Require specific role
fastify.get('/admin', {
  preHandler: [requireAuth, requireRole('admin')]
}, async (request, reply) => {
  // Only accessible to admins
});
```

**Generate tokens:**
```typescript
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';

const accessToken = generateAccessToken({
  userId: user.id,
  email: user.email,
  role: user.role
});

const refreshToken = generateRefreshToken({
  userId: user.id,
  email: user.email,
  role: user.role
});
```

**Database transactions (OAuth):**
```typescript
import { pool } from '../db';

const client = await pool.connect();
try {
  await client.query('BEGIN');

  // Create user
  const userResult = await client.query(
    'INSERT INTO users (email, name, email_verified) VALUES ($1, $2, true) RETURNING *',
    [email, name]
  );

  // Link OAuth provider
  await client.query(
    'INSERT INTO oauth_providers (user_id, provider, provider_user_id) VALUES ($1, $2, $3)',
    [userResult.rows[0].id, 'google', googleUserId]
  );

  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release();
}
```

### API Endpoints

**Email/Password Authentication:**

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/v1/auth/register` | POST | No | Register new user |
| `/v1/auth/login` | POST | No | Login with password |
| `/v1/auth/refresh` | POST | No | Refresh access token |
| `/v1/auth/me` | GET | Yes | Get current user |
| `/v1/auth/logout` | POST | No | Logout (client-side) |

**OAuth Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/auth/google` | GET | Initiate Google OAuth |
| `/v1/auth/google/callback` | GET | Google OAuth callback |
| `/v1/auth/github` | GET | Initiate GitHub OAuth |
| `/v1/auth/github/callback` | GET | GitHub OAuth callback |

### Testing Authentication

**Register a user:**
```bash
curl -X POST http://localhost:8080/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:8080/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Access protected endpoint:**
```bash
curl http://localhost:8080/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Refresh token:**
```bash
curl -X POST http://localhost:8080/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN"
  }'
```

### Setting Up OAuth Providers

**Google OAuth:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth client ID (Web application)
5. Add authorized redirect URIs:
   - Development: `http://localhost:8080/v1/auth/google/callback`
   - Production: `https://your-api.fly.dev/v1/auth/google/callback`
6. Copy Client ID and Secret to `.env`
7. Restart the API server

**GitHub OAuth:**

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Register a new OAuth App
3. Set homepage URL: `http://localhost:3000` (or your web app URL)
4. Set authorization callback URL:
   - Development: `http://localhost:8080/v1/auth/github/callback`
   - Production: `https://your-api.fly.dev/v1/auth/github/callback`
5. Generate a client secret
6. Copy Client ID and Secret to `.env`
7. Restart the API server

**Test OAuth flow:**
1. Visit `http://localhost:8080/v1/auth/google` in browser
2. Authorize with Google/GitHub
3. You'll be redirected to your web app with tokens in URL:
   ```
   http://localhost:3000/auth/callback?access_token=...&refresh_token=...&is_new_user=true
   ```

### Authentication Best Practices

1. **Never store access tokens in localStorage** (XSS vulnerability)
   - Web: Store access token in memory/React state only
   - Web: Store refresh token in httpOnly cookie (preferred) or localStorage
   - Mobile: Use platform secure storage (Keychain on iOS, Keystore on Android)

2. **Always use parameterized queries** to prevent SQL injection:
   ```typescript
   // Good
   await pool.query('SELECT * FROM users WHERE email = $1', [email]);

   // Bad - vulnerable!
   await pool.query(`SELECT * FROM users WHERE email = '${email}'`);
   ```

3. **Normalize emails** to prevent duplicate accounts:
   ```typescript
   import { normalizeEmail } from '../utils/email';
   const email = normalizeEmail(request.body.email); // Lowercase and trim
   ```

4. **Use database transactions** for multi-step operations:
   - OAuth user creation + provider linking
   - Any operation that must be atomic

5. **Check password_hash before allowing password login**:
   ```typescript
   if (!user.password_hash) {
     return reply.code(400).send({
       error: 'BadRequest',
       message: 'This account uses OAuth login. Please sign in with Google or GitHub.'
     });
   }
   ```

6. **Validate OAuth state parameter** to prevent CSRF attacks (already handled by OAuth utilities)

### Adding New Protected Routes

1. **Import the middleware:**
   ```typescript
   import { requireAuth, requireRole } from '../middleware/auth';
   ```

2. **Add preHandler:**
   ```typescript
   fastify.get('/api/protected', {
     preHandler: requireAuth
   }, async (request, reply) => {
     // Access user info
     const userId = request.user!.userId;
     const userEmail = request.user!.email;
     const userRole = request.user!.role;

     // Your logic here
   });
   ```

3. **For admin-only routes:**
   ```typescript
   fastify.delete('/api/users/:id', {
     preHandler: [requireAuth, requireRole('admin')]
   }, async (request, reply) => {
     // Only admins can access
   });
   ```

### Error Handling

**Common auth errors:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | ValidationError | Invalid request body (Zod validation failed) |
| 400 | BadRequest | OAuth-only account trying password login |
| 400 | OAuthStateInvalid | Invalid OAuth state (CSRF protection) |
| 401 | Unauthorized | Invalid credentials or expired token |
| 403 | Forbidden | Insufficient permissions (role check failed) |
| 403 | EmailVerificationRequired | Email must be verified before OAuth linking |
| 409 | Conflict | Email already exists (registration) |
| 409 | OAuthProviderConflict | OAuth account already linked to different user |

**Example error response:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token",
  "statusCode": 401
}
```

### Authentication Flow Diagram

```
Email/Password Registration:
1. Client → POST /v1/auth/register { email, password, name }
2. API → Normalize email → Hash password → Insert user
3. API → Generate JWT tokens
4. API → Return { user, tokens }

Email/Password Login:
1. Client → POST /v1/auth/login { email, password }
2. API → Find user by normalized email
3. API → Check if password_hash exists (not OAuth-only)
4. API → Compare password with bcrypt
5. API → Update last_login_at → Generate tokens
6. API → Return { user, tokens }

OAuth Flow (Google/GitHub):
1. Client → Visit /v1/auth/google or /v1/auth/github
2. API → Generate state (JWT with timestamp + nonce)
3. API → Redirect to Google/GitHub authorization page
4. User authorizes on provider's site
5. Provider → Redirect to /v1/auth/{provider}/callback?code=...&state=...
6. API → Validate state parameter (CSRF check)
7. API → Exchange code for access token
8. API → Fetch user info from provider API
9. API → Normalize email → Check if user exists
10. API → Create user OR link provider (in transaction)
11. API → Generate JWT tokens
12. API → Redirect to web app with tokens in URL
```

### Utilities Reference

**Location:** `apps/api/src/utils/`

- `jwt.ts` - Token generation/verification
- `password.ts` - bcrypt hashing
- `email.ts` - Email normalization
- `oauth-state.ts` - OAuth CSRF protection
- `oauth.ts` - OAuth provider integration

**Location:** `apps/api/src/middleware/`

- `auth.ts` - Authentication middleware

### Related Documentation

For complete implementation details, see:
- `AUTH_IMPLEMENTATION_PLAN.md` - Full specification
- `AUTH_PLAN_REVIEW.md` - Security review
- `AUTH_IMPLEMENTATION_STATUS.md` - Setup and testing guide

## Turborepo Pipeline

Understanding the build pipeline helps when adding new packages:

```json
{
  "build": {
    "dependsOn": ["^build"],  // Wait for dependencies to build first
    "outputs": [".next/**", "dist/**"]
  },
  "dev": {
    "cache": false,           // Never cache dev mode
    "persistent": true        // Keep running
  },
  "lint": {
    "dependsOn": ["^build"]   // Lint after dependencies build
  }
}
```

**Key behaviors:**
- Turbo automatically determines build order based on workspace dependencies
- `^build` means "build my dependencies first"
- Outputs are cached for faster subsequent builds
- `--filter` flag runs tasks only in specific packages

## Deployment

### API to Fly.io
```bash
cd apps/api

# First time setup
fly launch

# Subsequent deploys
fly deploy

# View logs
fly logs
```

See `docs/deployment-flyio.md` for detailed instructions.

### Web to Vercel/Netlify
```bash
cd apps/web
pnpm build
# Deploy .next/ directory
```

### Mobile
```bash
cd apps/mobile
flutter build ios --dart-define=API_BASE_URL=https://your-api.fly.dev
flutter build apk --dart-define=API_BASE_URL=https://your-api.fly.dev
```

## Important Patterns to Follow

### When Adding New Types
Always create BOTH a TypeScript interface and a Zod schema in `packages/shared`. This enables:
- Compile-time type checking (interface)
- Runtime validation (schema)
- Single source of truth

### When Using ApiClient
Always validate responses with the corresponding Zod schema to catch API contract violations at runtime:
```typescript
const data = await this.request<UserResponse>('/users/123');
return userResponseSchema.parse(data);  // Don't skip this!
```

### When Working with Next.js
- Use Server Components by default (no 'use client')
- Only add 'use client' when you need hooks, event handlers, or browser APIs
- Remember to add workspace packages to `transpilePackages` in next.config.js

### When Modifying Dependencies
- Build order matters: shared → api-client → web/api
- Run `pnpm install` after modifying workspace dependencies
- Turborepo will handle the build dependency graph

## Testing (Future)

Testing infrastructure is not yet implemented. When added:
- Unit tests: `<name>.test.ts` colocated with source
- Integration tests: `<name>.integration.test.ts`
- Target: 80% coverage for critical paths
- Required for API endpoints and shared utilities

## Documentation

Key documentation files in `docs/`:
- `architecture.md` - System components and data flow
- `conventions.md` - Code style, git workflow, naming conventions
- `contracts.md` - Current type-safety approach and future OpenAPI strategy
- `deployment-flyio.md` - Fly.io deployment guide

## Common Gotchas

1. **Forgot to build shared packages**: If web/API can't find types, run `pnpm build` in the shared package first
2. **Environment variables not working**: Next.js requires `NEXT_PUBLIC_` prefix for client-side vars
3. **TypeScript errors in Next.js**: Make sure workspace packages are in `transpilePackages`
4. **Turbo cache issues**: Run `pnpm clean` to clear build artifacts and caches
5. **Mobile can't reach API**: Use `http://10.0.2.2:8080` for Android emulator (not localhost)
6. **JWT secrets not configured**: Auth won't work without JWT_SECRET, JWT_REFRESH_SECRET, and OAUTH_STATE_SECRET in `.env`
7. **OAuth not working**: Ensure OAuth credentials are in `.env` and redirect URIs match exactly in provider settings
8. **401 on protected routes**: Check that Authorization header is `Bearer <token>` (note the space)
9. **Password login fails on OAuth account**: OAuth-only accounts have `password_hash = null`, they can't use password login
10. **Database migrations not applied**: Run migrations manually with `psql` before testing auth endpoints

## Node Version Requirement

This project requires Node.js >= 18.0.0 and pnpm >= 8.0.0. Check with:
```bash
node --version   # Should be >= 18
pnpm --version   # Should be >= 8
```
