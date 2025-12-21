import { z } from 'zod';

export const healthResponseSchema = z.object({
  status: z.enum(['ok', 'error']),
  timestamp: z.string(),
  version: z.string()
});

export const apiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number()
});

// ==================== Authentication Schemas ====================

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

export const authTokensSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.literal('Bearer'),
  expires_in: z.number()
});

// ==================== OAuth Schemas ====================

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

// ==================== Password Requirements (exported constants) ====================

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 100;
