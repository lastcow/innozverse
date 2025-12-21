# innozverse Repository Conventions

## Code Style

### TypeScript/JavaScript

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Line length**: 100 characters (soft limit)
- **Formatting**: Prettier with default config
- **Linting**: ESLint with TypeScript rules

**Example**:
```typescript
export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
}

export const checkHealth = async (): Promise<HealthResponse> => {
  const response = await fetch('/health');
  return response.json();
};
```

### Dart/Flutter

- **Indentation**: 2 spaces
- **Linting**: `flutter_lints` package
- **Formatting**: `dart format` (run automatically)
- **Naming**: 
  - Classes/Types: `PascalCase`
  - Files: `snake_case.dart`
  - Variables/Functions: `camelCase`

**Example**:
```dart
class HealthResponse {
  final String status;
  final String timestamp;
  final String version;

  HealthResponse({
    required this.status,
    required this.timestamp,
    required this.version,
  });
}
```

## File Organization

### TypeScript Projects
```
package/
├── src/               # Source code
│   ├── index.ts      # Main entry point
│   ├── types.ts      # Type definitions
│   └── utils/        # Utilities
├── dist/             # Compiled output (gitignored)
├── package.json
├── tsconfig.json
└── .eslintrc.js
```

### Next.js App
```
apps/web/
├── src/
│   └── app/          # App Router pages
│       ├── layout.tsx
│       ├── page.tsx
│       └── globals.css
├── public/           # Static assets
├── next.config.js
└── .env.example
```

### Flutter App
```
apps/mobile/
├── lib/
│   ├── main.dart
│   ├── services/     # API and business logic
│   ├── models/       # Data models
│   └── widgets/      # Reusable widgets
├── pubspec.yaml
└── README.md
```

## Naming Conventions

### Packages
- Format: `@innozverse/<name>`
- Examples: `@innozverse/shared`, `@innozverse/api-client`

### Files
- TypeScript: `kebab-case.ts` (e.g., `api-client.ts`, `health-check.ts`)
- React components: `PascalCase.tsx` (e.g., `Button.tsx`, `Header.tsx`)
- Dart: `snake_case.dart` (e.g., `api_service.dart`, `home_page.dart`)

### Variables and Functions
- TypeScript: `camelCase` (e.g., `getUserData`, `apiClient`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `API_VERSION`, `DEFAULT_PORT`)
- Dart: `camelCase` (e.g., `checkHealth`, `apiBaseUrl`)

### Types and Interfaces
- Format: `PascalCase`
- Suffix response types with `Response` (e.g., `HealthResponse`)
- Suffix error types with `Error` (e.g., `ApiError`)

## Git Workflow

### Branch Naming
- Features: `feature/description` (e.g., `feature/add-auth`)
- Bugs: `fix/description` (e.g., `fix/health-check-timeout`)
- Docs: `docs/description` (e.g., `docs/update-readme`)

### Commit Messages
Format: `type(scope): description`

**Types**:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Test additions or changes
- `chore` - Build process or auxiliary tool changes

**Examples**:
```
feat(api): add user authentication endpoint
fix(web): resolve infinite loop in health check
docs(readme): add deployment instructions
refactor(shared): extract validation schemas
```

### Pull Requests
1. Create feature branch from `main`
2. Make changes and commit
3. Run `pnpm lint` and `pnpm typecheck`
4. Push and open PR
5. Wait for CI to pass
6. Request review
7. Merge via squash commit

## Environment Variables

### Naming
- Prefix client-exposed vars with `NEXT_PUBLIC_` (Next.js)
- Use `UPPER_SNAKE_CASE`
- Be descriptive (e.g., `API_BASE_URL` not `URL`)

### Documentation
- Always add to `.env.example`
- Document in app-specific README
- Never commit actual `.env` files

### Example `.env.example`
```bash
# API Configuration
PORT=8080
NODE_ENV=development
API_VERSION=1.0.0

# CORS
CORS_ORIGIN=http://localhost:3000
```

## Scripts Conventions

### Package.json Scripts
Standardized across all packages:

- `dev` - Start development server
- `build` - Build for production
- `start` - Start production server
- `lint` - Run linter
- `format` - Format code
- `test` - Run tests
- `typecheck` - Type check TypeScript
- `clean` - Remove build artifacts

## Testing (To Be Implemented)

### File Naming
- Unit tests: `<name>.test.ts`
- Integration tests: `<name>.integration.test.ts`
- E2E tests: `<name>.e2e.test.ts`

### Location
- Colocate with source: `src/utils/__tests__/helper.test.ts`
- Or in dedicated folder: `tests/unit/helper.test.ts`

### Coverage
- Target: 80% coverage for critical paths
- Required for API endpoints and shared utilities

## Documentation

### Code Comments
- Use JSDoc for public APIs
- Explain "why" not "what"
- Keep comments up-to-date

**Example**:
```typescript
/**
 * Fetches health status from the API.
 * 
 * @returns Promise resolving to health status
 * @throws Error if API is unreachable
 */
export async function getHealth(): Promise<HealthResponse> {
  // Implementation
}
```

### README Files
Every package and app should have:
- Brief description
- Installation instructions
- Usage examples
- Available scripts
- Configuration options

## Error Handling

### TypeScript
```typescript
try {
  const data = await apiClient.getHealth();
  return data;
} catch (error) {
  if (error instanceof Error) {
    console.error('Health check failed:', error.message);
  }
  throw error;
}
```

### Dart
```dart
try {
  final health = await apiService.getHealth();
  return health;
} catch (e) {
  debugPrint('Health check failed: $e');
  rethrow;
}
```

## Dependencies

### Adding Dependencies
1. Use workspace protocol for internal packages: `"@innozverse/shared": "workspace:*"`
2. Pin versions or use caret ranges: `"react": "^18.2.0"`
3. Document why dependency is needed
4. Keep dependencies minimal

### Updating Dependencies
```bash
# Check for updates
pnpm outdated

# Update all within semver ranges
pnpm update

# Update specific package
pnpm update <package-name>
```

## Performance Guidelines

### Web
- Use Next.js Image component for images
- Implement code splitting for large pages
- Minimize client-side JavaScript
- Lazy load non-critical components

### API
- Use streaming responses for large data
- Implement caching where appropriate
- Validate input early
- Use connection pooling for databases

### Mobile
- Minimize API calls (cache when possible)
- Use Flutter's built-in performance tools
- Optimize images and assets
- Profile before optimizing

## Security Checklist

- [ ] No secrets in code
- [ ] Environment variables used correctly
- [ ] Input validation on all API endpoints
- [ ] CORS configured properly
- [ ] HTTPS in production
- [ ] Dependencies regularly updated
- [ ] Security headers configured

## CI/CD

### GitHub Actions
- Runs on push to `main` and `develop`
- Runs on all pull requests
- Checks:
  - Linting
  - Type checking
  - Building
  - Tests (when implemented)

### Pre-deployment
- All CI checks must pass
- At least one approval required
- No merge conflicts

## Future Conventions (To Be Defined)

- API versioning strategy
- Database migration process
- Feature flag system
- Monitoring and logging standards
- Incident response procedures
