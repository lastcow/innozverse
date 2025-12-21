# API Contracts & Codegen Strategy

This document outlines the current and future approach to maintaining type-safe contracts between the API, web, and mobile applications.

## Current State

### TypeScript Ecosystem (Web + API)

**Shared Types**: `@innozverse/shared`
- Domain types defined in TypeScript
- Zod schemas for runtime validation
- Constants for API routes and configuration

**API Client**: `@innozverse/api-client`
- Type-safe methods for API consumption
- Uses shared types from `@innozverse/shared`
- Runtime validation with Zod

**Benefits**:
- End-to-end type safety in TypeScript
- Compile-time errors for breaking changes
- Single source of truth for types

**Example**:
```typescript
// packages/shared/src/types.ts
export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
}

// packages/api-client/src/index.ts
async getHealth(): Promise<HealthResponse> {
  return this.request<HealthResponse>('/health');
}

// apps/web/src/app/page.tsx
const health = await apiClient.getHealth();
// health is typed as HealthResponse
```

### Flutter/Dart (Mobile)

**Current Approach**: Manual type definitions
- Types defined manually in Dart
- Mirrors TypeScript types
- No automatic synchronization

**Example**:
```dart
// apps/mobile/lib/services/api_service.dart
class HealthResponse {
  final String status;
  final String timestamp;
  final String version;
  
  HealthResponse({
    required this.status,
    required this.timestamp,
    required this.version,
  });
  
  factory HealthResponse.fromJson(Map<String, dynamic> json) {
    return HealthResponse(
      status: json['status'] as String,
      timestamp: json['timestamp'] as String,
      version: json['version'] as String,
    );
  }
}
```

**Limitations**:
- Manual synchronization required
- Potential for drift between TS and Dart types
- No compile-time safety across languages

## Future Strategy: OpenAPI

### Why OpenAPI?

1. **Language-Agnostic**: Single source of truth for all clients
2. **Code Generation**: Automatically generate TypeScript and Dart clients
3. **Documentation**: Auto-generated API docs
4. **Validation**: Request/response validation
5. **Tooling**: Excellent ecosystem (Swagger UI, etc.)

### Proposed Implementation

#### 1. Generate OpenAPI Spec from API

Use `@fastify/swagger` to generate OpenAPI 3.0 spec:

```typescript
// apps/api/src/index.ts
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

await fastify.register(swagger, {
  openapi: {
    info: {
      title: 'innozverse API',
      version: '1.0.0'
    },
    servers: [
      { url: 'http://localhost:8080' },
      { url: 'https://innozverse-api.fly.dev' }
    ]
  }
});

await fastify.register(swaggerUi, {
  routePrefix: '/docs'
});
```

**Routes with schema**:
```typescript
fastify.get('/health', {
  schema: {
    response: {
      200: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['ok', 'error'] },
          timestamp: { type: 'string' },
          version: { type: 'string' }
        }
      }
    }
  }
}, async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' };
});
```

#### 2. Generate TypeScript Client

Use `openapi-typescript-codegen` or `orval`:

```bash
pnpm add -D openapi-typescript-codegen
```

**Script**:
```json
{
  "scripts": {
    "generate:client": "openapi --input http://localhost:8080/openapi.json --output ./packages/api-client/src/generated"
  }
}
```

#### 3. Generate Dart Client

Use `openapi-generator` or `swagger-dart-code-generator`:

```bash
# Install globally
dart pub global activate openapi_generator_cli

# Generate Dart client
openapi-generator generate \
  -i http://localhost:8080/openapi.json \
  -g dart \
  -o apps/mobile/lib/generated/api
```

**pubspec.yaml**:
```yaml
dependencies:
  dio: ^5.4.0  # HTTP client
  json_annotation: ^4.8.1

dev_dependencies:
  build_runner: ^2.4.7
  json_serializable: ^6.7.1
```

### Workflow

#### Development Workflow

1. **Define API endpoint with JSON Schema**:
```typescript
// apps/api/src/routes/v1/users.ts
fastify.get('/users/:id', {
  schema: {
    params: {
      type: 'object',
      properties: {
        id: { type: 'string' }
      }
    },
    response: {
      200: UserResponseSchema
    }
  }
}, getUserHandler);
```

2. **Run API in development**:
```bash
pnpm dev:api
```

3. **Generate clients**:
```bash
pnpm run generate:clients
```

4. **Commit generated code**:
```bash
git add packages/api-client/src/generated
git add apps/mobile/lib/generated
git commit -m "feat: regenerate API clients"
```

#### CI/CD Integration

**Pre-commit hook**:
```bash
#!/bin/bash
# .husky/pre-commit
pnpm run generate:clients
git add packages/api-client/src/generated
git add apps/mobile/lib/generated
```

**GitHub Action**:
```yaml
name: Validate API Contracts

on: [pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm dev:api & # Start API
      - run: sleep 5
      - run: pnpm generate:clients
      - run: git diff --exit-code # Fail if generated files changed
```

## Implementation Plan

### Phase 1: Setup OpenAPI (Week 1)
- [ ] Add `@fastify/swagger` to API
- [ ] Add schemas to existing endpoints
- [ ] Verify OpenAPI spec at `/docs`

### Phase 2: TypeScript Codegen (Week 2)
- [ ] Set up `openapi-typescript-codegen`
- [ ] Generate initial client
- [ ] Replace manual client with generated
- [ ] Update web app to use generated client

### Phase 3: Dart Codegen (Week 3)
- [ ] Set up `openapi-generator` for Dart
- [ ] Generate initial Dart client
- [ ] Update mobile app to use generated client
- [ ] Add serialization with `json_serializable`

### Phase 4: Automation (Week 4)
- [ ] Add generation scripts to `package.json`
- [ ] Set up pre-commit hooks
- [ ] Add CI validation
- [ ] Document process in README

## Alternatives Considered

### 1. tRPC
**Pros**: Full type safety, great DX
**Cons**: TypeScript-only, tight coupling

### 2. GraphQL
**Pros**: Flexible queries, great tooling
**Cons**: Overhead for simple APIs, complexity

### 3. gRPC
**Pros**: High performance, strong contracts
**Cons**: Learning curve, HTTP/2 requirement

**Decision**: OpenAPI chosen for language-agnostic support and broad ecosystem.

## Best Practices

### Schema-First Design

1. **Define schema before implementation**:
```typescript
const UserSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    email: { type: 'string', format: 'email' }
  },
  required: ['id', 'name', 'email']
};
```

2. **Use JSON Schema for validation**
3. **Keep schemas versioned with API**

### Versioning

- Use API versioning (`/v1`, `/v2`)
- Never break existing contracts
- Deprecate gracefully with warnings
- Document changes in CHANGELOG

### Documentation

- Add descriptions to all schemas
- Include examples
- Document error responses
- Keep `/docs` up to date

### Testing

- Validate responses against schema
- Test generated clients
- Integration tests across all platforms

## Migration Strategy

For existing endpoints without schemas:

1. **Add schemas incrementally**
2. **Start with responses, then requests**
3. **Regenerate clients after each endpoint**
4. **Update apps to use generated code**

## Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Fastify JSON Schema](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/)
- [openapi-typescript-codegen](https://github.com/ferdikoomen/openapi-typescript-codegen)
- [OpenAPI Generator (Dart)](https://openapi-generator.tech/docs/generators/dart)

## Questions?

Open an issue in the repository or discuss in team meetings.
