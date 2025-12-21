# Authentication & Authorization Implementation Plan

## Overview
Implement JWT-based authentication and authorization system for innozverse API, accessible by both web and mobile applications. Support multiple authentication methods: email/password and OAuth (Google, GitHub).

## Architecture Decisions

### Authentication Strategy
- **JWT (JSON Web Tokens)** for stateless authentication
- **Access Token**: Short-lived (15 minutes), stored in memory/state
- **Refresh Token**: Long-lived (7 days), stored securely
- **bcrypt** for password hashing (cost factor: 10)
- **OAuth 2.0** for social login (Google, GitHub)
- **Account Linking**: Users can link multiple OAuth providers to one account

### Authorization Strategy
- **Role-based access control (RBAC)**
- Roles: `user`, `admin`
- Middleware-based authorization for protected routes

### OAuth Flow
1. User clicks "Login with Google/GitHub" on client
2. Client redirects to API OAuth endpoint: `/v1/auth/google` or `/v1/auth/github`
3. API generates OAuth state parameter (CSRF token) and stores in session/JWT
4. API redirects to provider's authorization page with state parameter
5. User authorizes on provider's site
6. Provider redirects back to API callback with state and authorization code
7. API validates state parameter (CSRF protection)
8. API exchanges code for access token with provider
9. API fetches user info from provider
10. API normalizes email to lowercase
11. API creates or finds user by email (with email verification check)
12. API links OAuth provider to user account (in database transaction)
13. API generates JWT tokens
14. API redirects to client with tokens in URL params or session

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT true,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  email_verified_at TIMESTAMP WITH TIME ZONE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

**Fields Explanation:**
- `id`: UUID primary key
- `email`: Unique user email (used for login, normalized to lowercase)
- `password_hash`: bcrypt hashed password
- `name`: User's display name
- `avatar_url`: Profile picture URL (from OAuth or user upload)
- `role`: User role for authorization (user, admin)
- `is_active`: Soft delete / account suspension flag
- `email_verified`: Email verification status
- `email_verified_at`: When email was verified
- `last_login_at`: Track last login time
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp (auto-updated via trigger)

**Note**: `password_hash` is nullable for OAuth-only accounts (users who never set a password).

### OAuth Providers Table
```sql
CREATE TABLE oauth_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  provider_email VARCHAR(255),
  provider_name VARCHAR(255),
  provider_avatar_url TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(provider, provider_user_id)
);

-- Indexes
CREATE INDEX idx_oauth_providers_user_id ON oauth_providers(user_id);
CREATE INDEX idx_oauth_providers_provider ON oauth_providers(provider);
```

**Fields Explanation:**
- `id`: UUID primary key
- `user_id`: Reference to users table (CASCADE delete)
- `provider`: OAuth provider name ('google', 'github')
- `provider_user_id`: User's ID from the OAuth provider
- `provider_email`: Email from OAuth provider
- `provider_name`: Name from OAuth provider
- `provider_avatar_url`: Profile picture URL from provider
- `access_token`: OAuth access token (encrypted in production)
- `refresh_token`: OAuth refresh token (encrypted in production)
- `token_expires_at`: When the OAuth token expires
- `created_at`: When linked
- `updated_at`: Last update timestamp
- **UNIQUE constraint**: One provider account can only link to one user

**Design Notes:**
- Users can have multiple OAuth providers (Google + GitHub)
- OAuth providers can't be shared between users (unique constraint)
- When user deletes account, all OAuth links are deleted (CASCADE)
- Tokens stored for potential future API calls to provider

## Type Definitions (@innozverse/shared)

### Types (types.ts)
```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: 'user' | 'admin';
  is_active: boolean;
  email_verified: boolean;
  email_verified_at: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number; // seconds
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginResponse {
  status: 'ok';
  data: {
    user: User;
    tokens: AuthTokens;
  };
}

export interface RegisterResponse {
  status: 'created';
  data: {
    user: User;
    tokens: AuthTokens;
  };
}

export interface MeResponse {
  status: 'ok';
  data: {
    user: User;
  };
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface RefreshResponse {
  status: 'ok';
  data: {
    tokens: AuthTokens;
  };
}

export interface OAuthProvider {
  id: string;
  user_id: string;
  provider: 'google' | 'github';
  provider_user_id: string;
  provider_email: string | null;
  provider_name: string | null;
  provider_avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface OAuthCallbackResponse {
  status: 'ok';
  data: {
    user: User;
    tokens: AuthTokens;
    isNewUser: boolean;
    linkedProvider: OAuthProvider;
  };
}

export interface UserWithProviders extends User {
  oauth_providers?: OAuthProvider[];
}
```

### Zod Schemas (schemas.ts)
```typescript
export const loginRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export const registerRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long'),
  name: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name is too long')
});

export const refreshRequestSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required')
});

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  avatar_url: z.string().nullable(),
  role: z.enum(['user', 'admin']),
  is_active: z.boolean(),
  email_verified: z.boolean(),
  email_verified_at: z.string().nullable(),
  last_login_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string()
});

export const oauthProviderSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  provider: z.enum(['google', 'github']),
  provider_user_id: z.string(),
  provider_email: z.string().nullable(),
  provider_name: z.string().nullable(),
  provider_avatar_url: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string()
});
```

## API Implementation (apps/api)

### Dependencies to Install
```bash
# JWT and password hashing
pnpm add jsonwebtoken bcrypt
pnpm add -D @types/jsonwebtoken @types/bcrypt

# OAuth 2.0
pnpm add @fastify/oauth2
```

### Environment Variables
```bash
# JWT Configuration
JWT_SECRET=<random-256-bit-secret>
JWT_REFRESH_SECRET=<different-random-256-bit-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OAuth State Security
OAUTH_STATE_SECRET=<random-256-bit-secret-for-state-tokens>

# Google OAuth
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_REDIRECT_URI=http://localhost:8080/v1/auth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=<your-github-client-id>
GITHUB_CLIENT_SECRET=<your-github-client-secret>
GITHUB_REDIRECT_URI=http://localhost:8080/v1/auth/github/callback

# Web app URL for OAuth redirects after authentication
WEB_APP_URL=http://localhost:3000
```

### Utilities

#### apps/api/src/utils/jwt.ts
```typescript
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateAccessToken(payload: JwtPayload): string;
export function generateRefreshToken(payload: JwtPayload): string;
export function verifyAccessToken(token: string): JwtPayload;
export function verifyRefreshToken(token: string): JwtPayload;
```

#### apps/api/src/utils/password.ts
```typescript
import bcrypt from 'bcrypt';

export async function hashPassword(password: string): Promise<string>;
export async function comparePassword(password: string, hash: string): Promise<boolean>;
```

#### apps/api/src/utils/email.ts
```typescript
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}
```

#### apps/api/src/utils/oauth.ts
```typescript
interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
  verified_email: boolean;
}

interface GitHubUserInfo {
  id: number;
  login: string;
  email: string;
  name: string;
  avatar_url: string;
}

interface OAuthStatePayload {
  timestamp: number;
  nonce: string;
}

export function generateOAuthState(): string; // Returns JWT with timestamp and nonce
export function validateOAuthState(state: string): boolean; // Verifies JWT and checks timestamp (5 min expiry)
export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo>;
export async function getGitHubUserInfo(accessToken: string): Promise<GitHubUserInfo>;
export async function findOrCreateUserFromOAuth(provider: string, userInfo: any): Promise<{ user: User, isNew: boolean }>;
export async function linkOAuthProvider(userId: string, provider: string, providerData: any): Promise<OAuthProvider>;
```

### Middleware

#### apps/api/src/middleware/auth.ts
```typescript
import { FastifyRequest, FastifyReply } from 'fastify';

export async function requireAuth(request: FastifyRequest, reply: FastifyReply);
export async function requireRole(...roles: string[]): (request, reply) => Promise<void>;
```

### Routes

#### apps/api/src/routes/v1/auth.ts
Endpoints:

**Email/Password Authentication:**
- `POST /v1/auth/register` - Register new user
- `POST /v1/auth/login` - Login and get tokens
- `POST /v1/auth/refresh` - Refresh access token
- `GET /v1/auth/me` - Get current user (protected)
- `POST /v1/auth/logout` - Logout (optional, client-side token deletion)

**OAuth Authentication:**
- `GET /v1/auth/google` - Initiate Google OAuth flow
- `GET /v1/auth/google/callback` - Google OAuth callback
- `GET /v1/auth/github` - Initiate GitHub OAuth flow
- `GET /v1/auth/github/callback` - GitHub OAuth callback

**Flows:**

**Email/Password Flow:**
1. Register: Validate → Hash password → Insert user → Generate tokens → Return user + tokens
2. Login: Validate → Find user → Compare password → Update last_login_at → Generate tokens → Return user + tokens
3. Refresh: Verify refresh token → Generate new access token → Return new tokens
4. Me: Verify access token (middleware) → Query user → Return user
5. Logout: Client deletes tokens (no server-side action needed for JWT)

**OAuth Flow (Google/GitHub):**
1. Initiate:
   - Generate OAuth state parameter (CSRF token)
   - Store state temporarily (in-memory cache or JWT)
   - Redirect to OAuth provider's authorization page with state
2. Callback:
   - Validate state parameter (CSRF protection)
   - Exchange code for access token
   - Fetch user info from provider
   - Normalize email to lowercase
   - Check if user exists by email
   - **Email Verification Check**: If user exists with password but email not verified, require verification before linking
   - If new: Create user in transaction (email_verified=true, no password, with avatar_url)
   - If exists: Update last_login_at and avatar_url
   - Check if OAuth provider already linked
   - If not linked: Create oauth_providers record (in same transaction for new users)
   - Commit transaction
   - Generate JWT tokens
   - Redirect to web app with tokens in URL: `${WEB_APP_URL}/auth/callback?access_token=xxx&refresh_token=yyy`

**Account Linking:**
- If user is already logged in (has valid access token) when doing OAuth:
  - Link the OAuth provider to existing account
  - Don't create a new user
  - Return success with updated user info
- **Security**: Prevent account takeover by checking email verification status before linking

## API Client Implementation (@innozverse/api-client)

### Methods to Add
```typescript
class ApiClient {
  // Email/Password Auth
  async register(data: RegisterRequest): Promise<RegisterResponse>;
  async login(data: LoginRequest): Promise<LoginResponse>;
  async refresh(refreshToken: string): Promise<RefreshResponse>;
  async getMe(): Promise<MeResponse>;
  async logout(): void; // Client-side token deletion

  // OAuth Helpers
  getGoogleAuthUrl(): string; // Returns: {API_URL}/v1/auth/google
  getGitHubAuthUrl(): string; // Returns: {API_URL}/v1/auth/github
  handleOAuthCallback(url: string): { accessToken: string, refreshToken: string } | null;

  // Token management
  setAccessToken(token: string): void;
  getAccessToken(): string | null;
  setRefreshToken(token: string): void;
  getRefreshToken(): string | null;
  clearTokens(): void;
}
```

**OAuth Integration in Web:**
```typescript
// Initiate OAuth
const authUrl = apiClient.getGoogleAuthUrl();
window.location.href = authUrl;

// Handle callback (on /auth/callback page)
const tokens = apiClient.handleOAuthCallback(window.location.href);
if (tokens) {
  apiClient.setAccessToken(tokens.accessToken);
  apiClient.setRefreshToken(tokens.refreshToken);
  // Redirect to app
  router.push('/dashboard');
}
```

### Token Storage
- **Web**: localStorage for refresh token, memory/state for access token
- **Mobile**: SecureStorage for both tokens
- API client auto-attaches Authorization header when token exists

## Security Considerations

### Password Security
- Minimum 8 characters (enforced by Zod schema)
- bcrypt with cost factor 10
- Never log or expose passwords
- Password is nullable for OAuth-only accounts

### JWT Security
- Use strong random secrets (256-bit minimum)
- Short-lived access tokens (15 minutes)
- Refresh tokens stored securely
- Tokens include: userId, email, role
- Verify signature on every request

### OAuth Security
- **OAuth state parameter** (CSRF protection) - generates JWT with timestamp and nonce, validates on callback
- **Email normalization** - all emails stored as lowercase to prevent duplicate accounts
- **Email verification check** - prevent account takeover by requiring email verification before linking OAuth to existing password-based account
- **Database transactions** - atomic user creation + provider linking for data consistency
- Use HTTPS for all OAuth redirects in production
- Store OAuth client secrets in environment variables, never in code
- Validate email from OAuth provider
- OAuth tokens encrypted at rest (future enhancement)
- Automatic email verification for OAuth users (verified_email=true)
- Avatar URL automatically populated from OAuth provider

### Database Security
- Use parameterized queries (prevent SQL injection)
- Index on email for performance
- Password hash never returned in API responses
- OAuth tokens stored (for future provider API calls)
- CASCADE delete on oauth_providers when user deleted

### API Security
- Rate limiting on auth endpoints (future)
- HTTPS only in production
- CORS configured for known origins
- Validate all OAuth redirect URIs match configured values

## Error Handling

### Standard Error Responses
```typescript
// 400 Bad Request - Validation error
{
  error: 'ValidationError',
  message: 'Invalid email address',
  statusCode: 400
}

// 400 Bad Request - OAuth-only account login attempt
{
  error: 'BadRequest',
  message: 'This account uses OAuth login. Please sign in with Google or GitHub.',
  statusCode: 400
}

// 400 Bad Request - Invalid OAuth state
{
  error: 'OAuthStateInvalid',
  message: 'Invalid or expired OAuth state parameter',
  statusCode: 400
}

// 400 Bad Request - OAuth authorization code exchange failed
{
  error: 'OAuthCodeInvalid',
  message: 'Failed to exchange authorization code',
  statusCode: 400
}

// 401 Unauthorized - Invalid credentials
{
  error: 'Unauthorized',
  message: 'Invalid email or password',
  statusCode: 401
}

// 401 Unauthorized - Invalid/expired token
{
  error: 'Unauthorized',
  message: 'Invalid or expired token',
  statusCode: 401
}

// 403 Forbidden - Insufficient permissions
{
  error: 'Forbidden',
  message: 'Insufficient permissions',
  statusCode: 403
}

// 403 Forbidden - Email verification required before OAuth linking
{
  error: 'EmailVerificationRequired',
  message: 'Email must be verified before linking OAuth provider',
  statusCode: 403
}

// 409 Conflict - Duplicate email
{
  error: 'Conflict',
  message: 'Email already exists',
  statusCode: 409
}

// 409 Conflict - OAuth provider already linked
{
  error: 'OAuthProviderConflict',
  message: 'This OAuth account is already linked to another user',
  statusCode: 409
}

// 500 Internal Server Error - Failed to fetch user info from OAuth provider
{
  error: 'OAuthProviderError',
  message: 'Failed to fetch user information from OAuth provider',
  statusCode: 500
}
```

## Testing Plan

### Manual Testing Steps

**Email/Password Authentication:**
1. **Register**: POST to /v1/auth/register with email, password, name
2. **Login**: POST to /v1/auth/login with email, password
3. **Protected Route**: GET /v1/auth/me with Authorization header
4. **Refresh**: POST to /v1/auth/refresh with refresh_token
5. **Invalid Token**: GET /v1/auth/me with invalid token (should return 401)
6. **Expired Token**: Wait for token to expire, try protected route
7. **Duplicate Email**: Try to register with existing email (should return 409)
8. **Login without password**: Try to login with OAuth-only account (should fail)

**OAuth Authentication:**
9. **Google OAuth - New User**:
   - Visit GET /v1/auth/google
   - Authorize on Google
   - Should redirect back with tokens
   - User should be created with email_verified=true
   - oauth_providers record should be created

10. **Google OAuth - Existing User**:
    - Create user via email/password first
    - Visit GET /v1/auth/google with same email
    - Should link OAuth provider to existing account
    - Should return existing user + tokens

11. **GitHub OAuth - New User**:
    - Visit GET /v1/auth/github
    - Authorize on GitHub
    - Should create new user and oauth_providers record

12. **GitHub OAuth - Existing User**:
    - Should link to existing account by email

13. **Multiple OAuth Providers**:
    - Link both Google and GitHub to same account
    - Verify user can login with either provider

14. **OAuth Provider Reuse**:
    - Try to link same Google account to different user (should fail - unique constraint)

15. **OAuth with Uppercase Email**:
    - Create account via OAuth with email "Test@Example.com"
    - Try to login via password with "test@example.com"
    - Should recognize as same user (email normalization)

16. **OAuth Account Takeover Prevention**:
    - Create password account with email "user@example.com" (email_verified=false)
    - Try to OAuth login with same email
    - Should require email verification before linking (prevent account takeover)

17. **OAuth State Validation**:
    - Initiate OAuth flow, capture state parameter
    - Try to use invalid/expired state in callback
    - Should return 400 OAuthStateInvalid error

18. **Password Login on OAuth-only Account**:
    - Create account via OAuth (no password set)
    - Try to login via POST /v1/auth/login with email
    - Should return 400 error: "This account uses OAuth login"

### Integration with Web
```typescript
// Email/Password Login flow
const { data } = await apiClient.login({ email, password });
apiClient.setAccessToken(data.tokens.access_token);
apiClient.setRefreshToken(data.tokens.refresh_token);

// OAuth Login flow
const googleAuthUrl = apiClient.getGoogleAuthUrl();
window.location.href = googleAuthUrl; // Redirects to Google

// On OAuth callback page (/auth/callback):
const tokens = apiClient.handleOAuthCallback(window.location.href);
if (tokens) {
  apiClient.setAccessToken(tokens.accessToken);
  apiClient.setRefreshToken(tokens.refreshToken);
  router.push('/dashboard');
}

// Protected request
const user = await apiClient.getMe(); // Auto-includes Authorization header

// Refresh flow
const refreshToken = apiClient.getRefreshToken();
const { data } = await apiClient.refresh(refreshToken);
apiClient.setAccessToken(data.tokens.access_token);
```

### Integration with Mobile (Flutter)
```dart
// Email/Password Login flow
final response = await apiService.login(email, password);
await secureStorage.write(key: 'access_token', value: response.accessToken);
await secureStorage.write(key: 'refresh_token', value: response.refreshToken);

// OAuth Login flow (using webview or system browser)
final authUrl = 'https://api.example.com/v1/auth/google';
// Open in webview, handle callback URL
// Extract tokens from callback URL parameters

// Protected request
final accessToken = await secureStorage.read(key: 'access_token');
final user = await apiService.getMe(accessToken);
```

## OAuth Setup Guide

### Google OAuth Setup

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select existing
3. **Enable Google+ API**: APIs & Services → Library → Google+ API → Enable
4. **Create OAuth credentials**:
   - APIs & Services → Credentials → Create Credentials → OAuth client ID
   - Application type: Web application
   - Authorized redirect URIs:
     - `http://localhost:8080/v1/auth/google/callback` (development)
     - `https://your-api.fly.dev/v1/auth/google/callback` (production)
5. **Copy Client ID and Client Secret** to `.env`:
   ```
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

**Scopes needed**: `email`, `profile`

### GitHub OAuth Setup

1. **Go to GitHub Settings**: https://github.com/settings/developers
2. **Register a new OAuth application**:
   - Settings → Developer settings → OAuth Apps → New OAuth App
   - Application name: innozverse (or your app name)
   - Homepage URL: `http://localhost:3000` (or your web app URL)
   - Authorization callback URL:
     - `http://localhost:8080/v1/auth/github/callback` (development)
     - `https://your-api.fly.dev/v1/auth/github/callback` (production)
3. **Create client secret** (after registration)
4. **Copy Client ID and Client Secret** to `.env`:
   ```
   GITHUB_CLIENT_ID=your-client-id
   GITHUB_CLIENT_SECRET=your-client-secret
   ```

**Scopes needed**: `user:email`, `read:user`

**Important Notes:**
- For production, update redirect URIs to use your actual API domain
- Keep client secrets secure, never commit to version control
- Web app URL (WEB_APP_URL) should match where your frontend is hosted
- OAuth apps can have multiple redirect URIs for dev/staging/prod

## Implementation Checklist

### Database
- [ ] Create users table migration (with avatar_url field)
- [ ] Create oauth_providers table migration
- [ ] Run migrations on database

### Shared Package (@innozverse/shared)
- [ ] Add User, AuthTokens, OAuth types (User includes avatar_url)
- [ ] Add Zod schemas (login, register, refresh, oauth)
- [ ] Build @innozverse/shared

### API Dependencies
- [ ] Install JWT and bcrypt dependencies
- [ ] Install OAuth dependencies (@fastify/oauth2)

### API Utilities
- [ ] Create JWT utility functions (sign, verify)
- [ ] Create password utility functions (hash, compare)
- [ ] Create email normalization utility (normalizeEmail)
- [ ] Create OAuth state functions (generateOAuthState, validateOAuthState)
- [ ] Create OAuth utility functions (getGoogleUserInfo, getGitHubUserInfo, findOrCreateUser, linkProvider)
- [ ] Add transaction handling for user creation + provider linking

### API Middleware
- [ ] Create auth middleware (requireAuth)
- [ ] Create role authorization middleware (requireRole)

### API Routes
- [ ] Create POST /v1/auth/register endpoint
- [ ] Create POST /v1/auth/login endpoint
- [ ] Create POST /v1/auth/refresh endpoint
- [ ] Create GET /v1/auth/me endpoint (protected)
- [ ] Create POST /v1/auth/logout endpoint
- [ ] Create GET /v1/auth/google endpoint (OAuth initiate)
- [ ] Create GET /v1/auth/google/callback endpoint
- [ ] Create GET /v1/auth/github endpoint (OAuth initiate)
- [ ] Create GET /v1/auth/github/callback endpoint
- [ ] Register all auth routes in API

### API Client (@innozverse/api-client)
- [ ] Add email/password auth methods (register, login, refresh, getMe, logout)
- [ ] Add OAuth helper methods (getGoogleAuthUrl, getGitHubAuthUrl, handleOAuthCallback)
- [ ] Add token storage methods
- [ ] Build @innozverse/api-client

### Configuration
- [ ] Update .env.example with JWT secrets (JWT_SECRET, JWT_REFRESH_SECRET)
- [ ] Update .env.example with OAuth state secret (OAUTH_STATE_SECRET)
- [ ] Update .env.example with OAuth client IDs and secrets
- [ ] Generate and set JWT secrets in .env (3 secrets: access, refresh, state)
- [ ] Set up Google OAuth app and add credentials to .env
- [ ] Set up GitHub OAuth app and add credentials to .env

### Documentation
- [ ] Update CLAUDE.md with authentication documentation
- [ ] Update CLAUDE.md with OAuth documentation

### Testing - Email/Password
- [ ] Test registration endpoint
- [ ] Test login endpoint
- [ ] Test protected endpoint with valid token
- [ ] Test protected endpoint with invalid token
- [ ] Test refresh token endpoint
- [ ] Test duplicate email registration

### Testing - OAuth
- [ ] Test Google OAuth flow (new user)
- [ ] Test Google OAuth flow (existing user)
- [ ] Test GitHub OAuth flow (new user)
- [ ] Test GitHub OAuth flow (existing user)
- [ ] Test linking multiple OAuth providers to one account
- [ ] Test OAuth provider uniqueness constraint
- [ ] Test OAuth with uppercase email (email normalization)
- [ ] Test OAuth account takeover prevention (email verification check)
- [ ] Test OAuth state validation (invalid/expired state)
- [ ] Test password login on OAuth-only account (should fail)

## Future Enhancements

1. **Email Verification**: Send verification email on registration
2. **Password Reset**: Forgot password flow with email
3. **Account Management**: Change password, update profile, unlink OAuth provider
4. **Two-Factor Authentication (2FA)**: TOTP or SMS
5. **Session Management**: Track active sessions, revoke tokens
6. **Rate Limiting**: Prevent brute force attacks on login/register endpoints
7. **Audit Logging**: Track authentication events for security monitoring
8. **Additional OAuth Providers**: Microsoft, Apple, Twitter, etc.
9. **OAuth Token Encryption**: Encrypt OAuth tokens at rest
10. **Refresh Token Rotation**: Rotate refresh tokens on each use for enhanced security
11. **Token Family Detection**: Detect and prevent refresh token reuse attacks

## Migration Strategy

For existing users (if any), we would need to:
1. Add users table alongside existing tables
2. No breaking changes to existing API endpoints
3. New auth endpoints are additive
4. Gradual rollout to clients

## Rollback Plan

If issues arise:
1. Keep migration file for reference
2. Can drop users table: `DROP TABLE IF EXISTS users CASCADE;`
3. Remove auth routes registration from API
4. Revert environment variable changes
5. Roll back package builds

---

**Estimated Implementation Time**: 4-6 hours
**Risk Level**: Low (additive changes, no breaking changes to existing API)
**Dependencies**: PostgreSQL database, pnpm workspace
