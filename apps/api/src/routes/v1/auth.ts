import { FastifyInstance } from 'fastify';
import { pool } from '../../db';
import {
  loginRequestSchema,
  registerRequestSchema,
  refreshRequestSchema,
  LoginRequest,
  RegisterRequest,
  RefreshRequest
} from '@innozverse/shared';
import { hashPassword, comparePassword } from '../../utils/password';
import { normalizeEmail } from '../../utils/email';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getAccessTokenExpiresIn
} from '../../utils/jwt';
import { requireAuth } from '../../middleware/auth';
import {
  findOrCreateUserFromOAuth,
  getGoogleUserInfo,
  getGitHubUserInfo
} from '../../utils/oauth';
import { generateOAuthState, validateOAuthState } from '../../utils/oauth-state';
import oauthPlugin from '@fastify/oauth2';

// Extend FastifyInstance to include OAuth plugins
declare module 'fastify' {
  interface FastifyInstance {
    googleOAuth?: any;
    githubOAuth?: any;
  }
}

export async function authRoutes(fastify: FastifyInstance) {
  // ==================== Email/Password Authentication ====================

  /**
   * POST /v1/auth/register
   * Register a new user with email and password
   */
  fastify.post<{ Body: RegisterRequest }>('/register', async (request, reply) => {
    try {
      const validation = registerRequestSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.code(400).send({
          error: 'ValidationError',
          message: validation.error.errors[0].message,
          statusCode: 400
        });
      }

      const { email, password, name } = validation.data;
      const normalizedEmail = normalizeEmail(email);

      // Check if user already exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [normalizedEmail]
      );

      if (existingUser.rows.length > 0) {
        return reply.code(409).send({
          error: 'Conflict',
          message: 'Email already exists',
          statusCode: 409
        });
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, name, email_verified, last_login_at)
         VALUES ($1, $2, $3, false, NOW())
         RETURNING id, email, name, avatar_url, role, is_active, status, email_verified, email_verified_at, last_login_at, created_at, updated_at`,
        [normalizedEmail, passwordHash, name]
      );

      const user = result.rows[0];

      // Generate tokens
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

      return reply.code(201).send({
        status: 'created',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar_url: user.avatar_url,
            role: user.role,
            is_active: user.is_active,
            status: user.status,
            email_verified: user.email_verified,
            email_verified_at: user.email_verified_at?.toISOString() || null,
            last_login_at: user.last_login_at?.toISOString() || null,
            created_at: user.created_at.toISOString(),
            updated_at: user.updated_at.toISOString()
          },
          tokens: {
            access_token: accessToken,
            refresh_token: refreshToken,
            token_type: 'Bearer' as const,
            expires_in: getAccessTokenExpiresIn()
          }
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'InternalServerError',
        message: 'Failed to register user',
        statusCode: 500
      });
    }
  });

  /**
   * POST /v1/auth/login
   * Login with email and password
   */
  fastify.post<{ Body: LoginRequest }>('/login', async (request, reply) => {
    try {
      const validation = loginRequestSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.code(400).send({
          error: 'ValidationError',
          message: validation.error.errors[0].message,
          statusCode: 400
        });
      }

      const { email, password } = validation.data;
      const normalizedEmail = normalizeEmail(email);

      // Find user
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1 AND is_active = true',
        [normalizedEmail]
      );

      if (result.rows.length === 0) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Invalid email or password',
          statusCode: 401
        });
      }

      const user = result.rows[0];

      // Check if user has a password (not OAuth-only account)
      if (!user.password_hash) {
        return reply.code(400).send({
          error: 'BadRequest',
          message: 'This account uses OAuth login. Please sign in with Google or GitHub.',
          statusCode: 400
        });
      }

      // Verify password
      const isValid = await comparePassword(password, user.password_hash);
      if (!isValid) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Invalid email or password',
          statusCode: 401
        });
      }

      // Update last login
      await pool.query(
        'UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1',
        [user.id]
      );

      // Generate tokens
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

      return reply.send({
        status: 'ok',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar_url: user.avatar_url,
            role: user.role,
            is_active: user.is_active,
            status: user.status,
            email_verified: user.email_verified,
            email_verified_at: user.email_verified_at?.toISOString() || null,
            last_login_at: new Date().toISOString(),
            created_at: user.created_at.toISOString(),
            updated_at: user.updated_at.toISOString()
          },
          tokens: {
            access_token: accessToken,
            refresh_token: refreshToken,
            token_type: 'Bearer' as const,
            expires_in: getAccessTokenExpiresIn()
          }
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'InternalServerError',
        message: 'Failed to login',
        statusCode: 500
      });
    }
  });

  /**
   * POST /v1/auth/refresh
   * Refresh access token using refresh token
   */
  fastify.post<{ Body: RefreshRequest }>('/refresh', async (request, reply) => {
    try {
      const validation = refreshRequestSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.code(400).send({
          error: 'ValidationError',
          message: validation.error.errors[0].message,
          statusCode: 400
        });
      }

      const { refresh_token } = validation.data;

      // Verify refresh token
      const payload = verifyRefreshToken(refresh_token);

      // Generate new access token
      const accessToken = generateAccessToken({
        userId: payload.userId,
        email: payload.email,
        role: payload.role
      });

      return reply.send({
        status: 'ok',
        data: {
          tokens: {
            access_token: accessToken,
            refresh_token: refresh_token, // Return same refresh token
            token_type: 'Bearer' as const,
            expires_in: getAccessTokenExpiresIn()
          }
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid refresh token';
      return reply.code(401).send({
        error: 'Unauthorized',
        message,
        statusCode: 401
      });
    }
  });

  /**
   * GET /v1/auth/me
   * Get current user info (protected route)
   */
  fastify.get('/me', {
    preHandler: requireAuth
  }, async (request, reply) => {
    try {
      if (!request.user) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Authentication required',
          statusCode: 401
        });
      }

      const result = await pool.query(
        'SELECT * FROM users WHERE id = $1 AND is_active = true',
        [request.user.userId]
      );

      if (result.rows.length === 0) {
        return reply.code(404).send({
          error: 'NotFound',
          message: 'User not found',
          statusCode: 404
        });
      }

      const user = result.rows[0];

      return reply.send({
        status: 'ok',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar_url: user.avatar_url,
            role: user.role,
            is_active: user.is_active,
            status: user.status,
            email_verified: user.email_verified,
            email_verified_at: user.email_verified_at?.toISOString() || null,
            last_login_at: user.last_login_at?.toISOString() || null,
            created_at: user.created_at.toISOString(),
            updated_at: user.updated_at.toISOString()
          }
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'InternalServerError',
        message: 'Failed to get user info',
        statusCode: 500
      });
    }
  });

  /**
   * POST /v1/auth/logout
   * Logout (client-side token deletion, no server action for JWT)
   */
  fastify.post('/logout', async (_request, reply) => {
    return reply.send({
      status: 'ok',
      message: 'Logged out successfully. Please delete tokens on client side.'
    });
  });

  // ==================== OAuth Configuration ====================

  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
  const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
  const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
  const WEB_APP_URL = process.env.WEB_APP_URL || 'http://localhost:3000';

  // Register OAuth plugins if credentials are configured
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    await fastify.register(oauthPlugin, {
      name: 'googleOAuth',
      credentials: {
        client: {
          id: GOOGLE_CLIENT_ID,
          secret: GOOGLE_CLIENT_SECRET
        },
        auth: oauthPlugin.GOOGLE_CONFIGURATION
      },
      // Don't use startRedirectPath - we'll handle routes manually for state parameter
      callbackUri: `${process.env.API_URL || 'http://localhost:8080'}/v1/auth/google/callback`
    });
  }

  if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET) {
    await fastify.register(oauthPlugin, {
      name: 'githubOAuth',
      credentials: {
        client: {
          id: GITHUB_CLIENT_ID,
          secret: GITHUB_CLIENT_SECRET
        },
        auth: oauthPlugin.GITHUB_CONFIGURATION
      },
      // Don't use startRedirectPath - we'll handle routes manually for state parameter
      callbackUri: `${process.env.API_URL || 'http://localhost:8080'}/v1/auth/github/callback`,
      scope: ['user:email', 'read:user']
    });
  }

  // ==================== OAuth Routes ====================

  /**
   * GET /v1/auth/google
   * Initiate Google OAuth flow
   */
  fastify.get('/google', async (_request, reply) => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return reply.code(500).send({
        error: 'ConfigurationError',
        message: 'Google OAuth not configured',
        statusCode: 500
      });
    }

    const state = generateOAuthState();

    // Build Google OAuth URL manually with state parameter
    const callbackUri = process.env.GOOGLE_CALLBACK_URI || `${WEB_APP_URL}/api/auth/callback/google`;
    const scope = 'openid profile email';
    const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth';

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: callbackUri,
      response_type: 'code',
      scope: scope,
      state: state,
      access_type: 'offline',
      prompt: 'consent'
    });

    return reply.redirect(`${authUrl}?${params.toString()}`);
  });

  /**
   * GET /v1/auth/google/callback
   * Handle Google OAuth callback
   */
  fastify.get('/google/callback', async (request, reply) => {
    try {
      const { state, code } = request.query as { state?: string; code?: string };

      // Validate state parameter (CSRF protection)
      if (!state || !validateOAuthState(state)) {
        return reply.code(400).send({
          error: 'OAuthStateInvalid',
          message: 'Invalid or expired OAuth state parameter',
          statusCode: 400
        });
      }

      if (!code) {
        return reply.code(400).send({
          error: 'OAuthCodeInvalid',
          message: 'Authorization code not provided',
          statusCode: 400
        });
      }

      // Exchange code for token
      const googleOAuth = fastify.googleOAuth;
      const token = await googleOAuth.getAccessTokenFromAuthorizationCodeFlow(request);

      // Get user info from Google
      const userInfo = await getGoogleUserInfo(token.access_token);

      // Find or create user
      const { user, isNewUser } = await findOrCreateUserFromOAuth(
        'google',
        userInfo,
        token.access_token,
        token.refresh_token
      );

      // Generate JWT tokens
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

      // Redirect to web app with tokens
      const redirectUrl = new URL(`${WEB_APP_URL}/auth/callback`);
      redirectUrl.searchParams.set('access_token', accessToken);
      redirectUrl.searchParams.set('refresh_token', refreshToken);
      redirectUrl.searchParams.set('is_new_user', isNewUser.toString());

      return reply.redirect(redirectUrl.toString());
    } catch (error) {
      fastify.log.error(error);

      if (error instanceof Error && error.message === 'EMAIL_VERIFICATION_REQUIRED') {
        return reply.code(403).send({
          error: 'EmailVerificationRequired',
          message: 'Email must be verified before linking OAuth provider',
          statusCode: 403
        });
      }

      return reply.code(500).send({
        error: 'OAuthProviderError',
        message: 'Failed to complete Google OAuth',
        statusCode: 500
      });
    }
  });

  /**
   * GET /v1/auth/github
   * Initiate GitHub OAuth flow
   */
  fastify.get('/github', async (_request, reply) => {
    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
      return reply.code(500).send({
        error: 'ConfigurationError',
        message: 'GitHub OAuth not configured',
        statusCode: 500
      });
    }

    const state = generateOAuthState();

    // Build GitHub OAuth URL manually with state parameter
    const callbackUri = process.env.GITHUB_CALLBACK_URI || `${WEB_APP_URL}/api/auth/callback/github`;
    const scope = 'user:email read:user';
    const authUrl = 'https://github.com/login/oauth/authorize';

    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: callbackUri,
      scope: scope,
      state: state
    });

    return reply.redirect(`${authUrl}?${params.toString()}`);
  });

  /**
   * GET /v1/auth/github/callback
   * Handle GitHub OAuth callback
   */
  fastify.get('/github/callback', async (request, reply) => {
    try {
      const { state, code } = request.query as { state?: string; code?: string };

      // Validate state parameter (CSRF protection)
      if (!state || !validateOAuthState(state)) {
        return reply.code(400).send({
          error: 'OAuthStateInvalid',
          message: 'Invalid or expired OAuth state parameter',
          statusCode: 400
        });
      }

      if (!code) {
        return reply.code(400).send({
          error: 'OAuthCodeInvalid',
          message: 'Authorization code not provided',
          statusCode: 400
        });
      }

      // Exchange code for token
      const githubOAuth = fastify.githubOAuth;
      const token = await githubOAuth.getAccessTokenFromAuthorizationCodeFlow(request);

      // Get user info from GitHub
      const userInfo = await getGitHubUserInfo(token.access_token);

      // Find or create user
      const { user, isNewUser } = await findOrCreateUserFromOAuth(
        'github',
        userInfo,
        token.access_token,
        token.refresh_token
      );

      // Generate JWT tokens
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

      // Redirect to web app with tokens
      const redirectUrl = new URL(`${WEB_APP_URL}/auth/callback`);
      redirectUrl.searchParams.set('access_token', accessToken);
      redirectUrl.searchParams.set('refresh_token', refreshToken);
      redirectUrl.searchParams.set('is_new_user', isNewUser.toString());

      return reply.redirect(redirectUrl.toString());
    } catch (error) {
      fastify.log.error(error);

      if (error instanceof Error && error.message === 'EMAIL_VERIFICATION_REQUIRED') {
        return reply.code(403).send({
          error: 'EmailVerificationRequired',
          message: 'Email must be verified before linking OAuth provider',
          statusCode: 403
        });
      }

      return reply.code(500).send({
        error: 'OAuthProviderError',
        message: 'Failed to complete GitHub OAuth',
        statusCode: 500
      });
    }
  });

  // ==================== OAuth Token Exchange Endpoints ====================

  /**
   * POST /v1/auth/google/exchange
   * Exchange Google authorization code for tokens
   */
  fastify.post<{ Body: { code: string; state: string } }>('/google/exchange', async (request, reply) => {
    try {
      const { code, state } = request.body;

      // Validate state parameter (CSRF protection)
      if (!state || !validateOAuthState(state)) {
        return reply.code(400).send({
          error: 'OAuthStateInvalid',
          message: 'Invalid or expired OAuth state parameter',
          statusCode: 400
        });
      }

      if (!code) {
        return reply.code(400).send({
          error: 'OAuthCodeInvalid',
          message: 'Authorization code not provided',
          statusCode: 400
        });
      }

      // Exchange code for access token
      const tokenUrl = 'https://oauth2.googleapis.com/token';
      const callbackUri = process.env.GOOGLE_CALLBACK_URI || `${WEB_APP_URL}/api/auth/callback/google`;

      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: callbackUri,
          grant_type: 'authorization_code'
        }).toString()
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const tokenData = await tokenResponse.json() as { access_token: string; refresh_token?: string };

      // Get user info from Google
      const userInfo = await getGoogleUserInfo(tokenData.access_token);

      // Find or create user
      const { user, isNewUser } = await findOrCreateUserFromOAuth(
        'google',
        userInfo,
        tokenData.access_token,
        tokenData.refresh_token
      );

      // Generate JWT tokens
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

      return reply.send({
        status: 'ok',
        data: {
          access_token: accessToken,
          refresh_token: refreshToken,
          is_new_user: isNewUser
        }
      });
    } catch (error) {
      fastify.log.error(error);

      if (error instanceof Error && error.message === 'EMAIL_VERIFICATION_REQUIRED') {
        return reply.code(403).send({
          error: 'EmailVerificationRequired',
          message: 'Email must be verified before linking OAuth provider',
          statusCode: 403
        });
      }

      return reply.code(500).send({
        error: 'OAuthProviderError',
        message: 'Failed to complete Google OAuth',
        statusCode: 500
      });
    }
  });

  /**
   * POST /v1/auth/github/exchange
   * Exchange GitHub authorization code for tokens
   */
  fastify.post<{ Body: { code: string; state: string } }>('/github/exchange', async (request, reply) => {
    try {
      const { code, state } = request.body;

      // Validate state parameter (CSRF protection)
      if (!state || !validateOAuthState(state)) {
        return reply.code(400).send({
          error: 'OAuthStateInvalid',
          message: 'Invalid or expired OAuth state parameter',
          statusCode: 400
        });
      }

      if (!code) {
        return reply.code(400).send({
          error: 'OAuthCodeInvalid',
          message: 'Authorization code not provided',
          statusCode: 400
        });
      }

      // Exchange code for access token
      const tokenUrl = 'https://github.com/login/oauth/access_token';
      const callbackUri = process.env.GITHUB_CALLBACK_URI || `${WEB_APP_URL}/api/auth/callback/github`;

      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          code,
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          redirect_uri: callbackUri
        })
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const tokenData = await tokenResponse.json() as { access_token: string; refresh_token?: string };

      // Get user info from GitHub
      const userInfo = await getGitHubUserInfo(tokenData.access_token);

      // Find or create user
      const { user, isNewUser } = await findOrCreateUserFromOAuth(
        'github',
        userInfo,
        tokenData.access_token,
        tokenData.refresh_token
      );

      // Generate JWT tokens
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

      return reply.send({
        status: 'ok',
        data: {
          access_token: accessToken,
          refresh_token: refreshToken,
          is_new_user: isNewUser
        }
      });
    } catch (error) {
      fastify.log.error(error);

      if (error instanceof Error && error.message === 'EMAIL_VERIFICATION_REQUIRED') {
        return reply.code(403).send({
          error: 'EmailVerificationRequired',
          message: 'Email must be verified before linking OAuth provider',
          statusCode: 403
        });
      }

      return reply.code(500).send({
        error: 'OAuthProviderError',
        message: 'Failed to complete GitHub OAuth',
        statusCode: 500
      });
    }
  });

  // ==================== Invite Acceptance ====================

  /**
   * POST /v1/auth/accept-invite
   * Accept an invitation and set password
   */
  fastify.post<{ Body: { token: string; password: string } }>('/accept-invite', async (request, reply) => {
    try {
      const { token, password } = request.body;

      if (!token || !password) {
        return reply.code(400).send({
          error: 'ValidationError',
          message: 'Token and password are required',
          statusCode: 400
        });
      }

      // Validate password strength
      if (password.length < 8) {
        return reply.code(400).send({
          error: 'ValidationError',
          message: 'Password must be at least 8 characters long',
          statusCode: 400
        });
      }

      // Find user by invite token
      const userResult = await pool.query(
        'SELECT id, email, name, invite_expires_at FROM users WHERE invite_token = $1',
        [token]
      );

      if (userResult.rows.length === 0) {
        return reply.code(400).send({
          error: 'InvalidToken',
          message: 'Invalid invitation token',
          statusCode: 400
        });
      }

      const user = userResult.rows[0];

      // Check if token has expired
      if (new Date() > new Date(user.invite_expires_at)) {
        return reply.code(400).send({
          error: 'TokenExpired',
          message: 'Invitation token has expired',
          statusCode: 400
        });
      }

      // Hash the password
      const passwordHash = await hashPassword(password);

      // Update user: set password, verify email, activate account, clear invite token
      await pool.query(
        `UPDATE users
         SET password_hash = $1, email_verified = true, email_verified_at = CURRENT_TIMESTAMP,
             is_active = true, status = 'active', invite_token = NULL, invite_expires_at = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [passwordHash, user.id]
      );

      // Get updated user info
      const updatedUser = await pool.query(
        'SELECT id, email, name, avatar_url, role, is_active, status, email_verified FROM users WHERE id = $1',
        [user.id]
      );

      // Generate JWT tokens
      const accessToken = generateAccessToken({
        userId: updatedUser.rows[0].id,
        email: updatedUser.rows[0].email,
        role: updatedUser.rows[0].role
      });

      const refreshToken = generateRefreshToken({
        userId: updatedUser.rows[0].id,
        email: updatedUser.rows[0].email,
        role: updatedUser.rows[0].role
      });

      return reply.send({
        status: 'ok',
        data: {
          access_token: accessToken,
          refresh_token: refreshToken,
          user: updatedUser.rows[0]
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'InternalServerError',
        message: 'Failed to accept invitation',
        statusCode: 500
      });
    }
  });

  /**
   * GET /v1/auth/validate-invite
   * Validate an invitation token
   */
  fastify.get<{ Querystring: { token: string } }>('/validate-invite', async (request, reply) => {
    try {
      const { token } = request.query;

      if (!token) {
        return reply.code(400).send({
          error: 'ValidationError',
          message: 'Token is required',
          statusCode: 400
        });
      }

      // Find user by invite token
      const userResult = await pool.query(
        'SELECT id, email, name, invite_expires_at FROM users WHERE invite_token = $1',
        [token]
      );

      if (userResult.rows.length === 0) {
        return reply.code(400).send({
          error: 'InvalidToken',
          message: 'Invalid invitation token',
          statusCode: 400
        });
      }

      const user = userResult.rows[0];

      // Check if token has expired
      if (new Date() > new Date(user.invite_expires_at)) {
        return reply.code(400).send({
          error: 'TokenExpired',
          message: 'Invitation token has expired',
          statusCode: 400
        });
      }

      return reply.send({
        status: 'ok',
        data: {
          email: user.email,
          name: user.name
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        error: 'InternalServerError',
        message: 'Failed to validate invitation',
        statusCode: 500
      });
    }
  });
}
