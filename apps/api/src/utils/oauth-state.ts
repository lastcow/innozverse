import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const OAUTH_STATE_SECRET = process.env.OAUTH_STATE_SECRET || '';
const OAUTH_STATE_EXPIRES_IN = '5m'; // 5 minutes

if (!OAUTH_STATE_SECRET) {
  console.warn('⚠️  OAUTH_STATE_SECRET not configured - OAuth CSRF protection will not work properly');
}

export interface OAuthStatePayload {
  timestamp: number;
  nonce: string;
}

/**
 * Generate a secure OAuth state parameter using JWT
 * Used for CSRF protection during OAuth flows
 * @returns A JWT string containing timestamp and nonce
 */
export function generateOAuthState(): string {
  const payload: OAuthStatePayload = {
    timestamp: Date.now(),
    nonce: crypto.randomBytes(16).toString('hex')
  };

  return jwt.sign(payload, OAUTH_STATE_SECRET, {
    expiresIn: OAUTH_STATE_EXPIRES_IN,
    issuer: 'innozverse-oauth'
  });
}

/**
 * Validate an OAuth state parameter
 * Verifies the JWT signature and checks that it hasn't expired
 * @param state - The OAuth state JWT to validate
 * @returns True if valid, false otherwise
 */
export function validateOAuthState(state: string): boolean {
  try {
    jwt.verify(state, OAUTH_STATE_SECRET, {
      issuer: 'innozverse-oauth'
    });
    return true;
  } catch (error) {
    // Token is invalid or expired
    return false;
  }
}
