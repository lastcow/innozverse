import { pool } from '../db';
import { User, OAuthProvider } from '@innozverse/shared';
import { normalizeEmail } from './email';

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
  verified_email: boolean;
}

export interface GitHubUserInfo {
  id: number;
  login: string;
  email: string;
  name: string;
  avatar_url: string;
}

export interface GitHubEmailInfo {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
}

/**
 * Fetch user info from Google OAuth API
 */
export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Google user info');
  }

  return response.json() as Promise<GoogleUserInfo>;
}

/**
 * Fetch user info from GitHub OAuth API
 */
export async function getGitHubUserInfo(accessToken: string): Promise<GitHubUserInfo> {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch GitHub user info');
  }

  const userData = await response.json() as GitHubUserInfo;

  // If email is null, fetch from emails endpoint
  if (!userData.email) {
    const emailsResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    if (emailsResponse.ok) {
      const emails = await emailsResponse.json() as GitHubEmailInfo[];
      const primaryEmail = emails.find(e => e.primary && e.verified);
      if (primaryEmail) {
        userData.email = primaryEmail.email;
      }
    }
  }

  return userData;
}

/**
 * Find or create a user from OAuth provider data
 * Uses database transactions to ensure atomicity
 */
export async function findOrCreateUserFromOAuth(
  provider: 'google' | 'github',
  userInfo: GoogleUserInfo | GitHubUserInfo,
  accessToken: string,
  refreshToken?: string
): Promise<{ user: User; isNewUser: boolean; linkedProvider: OAuthProvider }> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const email = normalizeEmail(userInfo.email);
    const providerUserId = userInfo.id.toString();
    const providerName = userInfo.name || (userInfo as GitHubUserInfo).login || 'User';
    const avatarUrl = (userInfo as GoogleUserInfo).picture || (userInfo as GitHubUserInfo).avatar_url;

    // Check if OAuth provider is already linked
    const existingProviderResult = await client.query(
      'SELECT * FROM oauth_providers WHERE provider = $1 AND provider_user_id = $2',
      [provider, providerUserId]
    );

    if (existingProviderResult.rows.length > 0) {
      // OAuth provider already exists, get the user
      const userId = existingProviderResult.rows[0].user_id;
      const userResult = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found for existing OAuth provider');
      }

      // Update last login and avatar
      await client.query(
        'UPDATE users SET last_login_at = NOW(), avatar_url = COALESCE($1, avatar_url), updated_at = NOW() WHERE id = $2',
        [avatarUrl, userId]
      );

      // Update OAuth provider tokens
      await client.query(
        'UPDATE oauth_providers SET access_token = $1, refresh_token = $2, token_expires_at = NOW() + INTERVAL \'1 hour\', updated_at = NOW() WHERE id = $3',
        [accessToken, refreshToken, existingProviderResult.rows[0].id]
      );

      await client.query('COMMIT');

      const updatedUserResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
      const updatedProviderResult = await pool.query('SELECT * FROM oauth_providers WHERE id = $1', [existingProviderResult.rows[0].id]);

      return {
        user: mapRowToUser(updatedUserResult.rows[0]),
        isNewUser: false,
        linkedProvider: mapRowToOAuthProvider(updatedProviderResult.rows[0])
      };
    }

    // Check if user exists with this email
    const existingUserResult = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    let userId: string;
    let isNewUser = false;

    if (existingUserResult.rows.length > 0) {
      // User exists - link OAuth provider to existing account
      const existingUser = existingUserResult.rows[0];
      userId = existingUser.id;

      // Security check: If user has password but email not verified, prevent OAuth linking
      if (existingUser.password_hash && !existingUser.email_verified) {
        await client.query('ROLLBACK');
        throw new Error('EMAIL_VERIFICATION_REQUIRED');
      }

      // Update last login and avatar
      await client.query(
        'UPDATE users SET last_login_at = NOW(), avatar_url = COALESCE($1, avatar_url), updated_at = NOW() WHERE id = $2',
        [avatarUrl, userId]
      );
    } else {
      // Create new user - email is verified through OAuth
      const newUserResult = await client.query(
        `INSERT INTO users (email, name, avatar_url, email_verified, email_verified_at, last_login_at)
         VALUES ($1, $2, $3, true, NOW(), NOW())
         RETURNING *`,
        [email, providerName, avatarUrl]
      );
      userId = newUserResult.rows[0].id;
      isNewUser = true;
    }

    // Link OAuth provider
    const newProviderResult = await client.query(
      `INSERT INTO oauth_providers (user_id, provider, provider_user_id, provider_email, provider_name, provider_avatar_url, access_token, refresh_token, token_expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() + INTERVAL '1 hour')
       RETURNING *`,
      [userId, provider, providerUserId, email, providerName, avatarUrl, accessToken, refreshToken]
    );

    await client.query('COMMIT');

    // Fetch final user and provider data
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const providerResult = await pool.query('SELECT * FROM oauth_providers WHERE id = $1', [newProviderResult.rows[0].id]);

    return {
      user: mapRowToUser(userResult.rows[0]),
      isNewUser,
      linkedProvider: mapRowToOAuthProvider(providerResult.rows[0])
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Link an OAuth provider to an existing logged-in user
 */
export async function linkOAuthProvider(
  userId: string,
  provider: 'google' | 'github',
  userInfo: GoogleUserInfo | GitHubUserInfo,
  accessToken: string,
  refreshToken?: string
): Promise<OAuthProvider> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const email = normalizeEmail(userInfo.email);
    const providerUserId = userInfo.id.toString();
    const providerName = userInfo.name || (userInfo as GitHubUserInfo).login || 'User';
    const avatarUrl = (userInfo as GoogleUserInfo).picture || (userInfo as GitHubUserInfo).avatar_url;

    // Check if this OAuth provider is already linked to another user
    const existingProviderResult = await client.query(
      'SELECT * FROM oauth_providers WHERE provider = $1 AND provider_user_id = $2',
      [provider, providerUserId]
    );

    if (existingProviderResult.rows.length > 0) {
      const existingUserId = existingProviderResult.rows[0].user_id;
      if (existingUserId !== userId) {
        await client.query('ROLLBACK');
        throw new Error('OAUTH_PROVIDER_CONFLICT');
      }
      // Already linked to this user, just update tokens
      await client.query(
        'UPDATE oauth_providers SET access_token = $1, refresh_token = $2, token_expires_at = NOW() + INTERVAL \'1 hour\', updated_at = NOW() WHERE id = $3',
        [accessToken, refreshToken, existingProviderResult.rows[0].id]
      );
      await client.query('COMMIT');

      const updatedResult = await pool.query('SELECT * FROM oauth_providers WHERE id = $1', [existingProviderResult.rows[0].id]);
      return mapRowToOAuthProvider(updatedResult.rows[0]);
    }

    // Create new OAuth provider link
    const newProviderResult = await client.query(
      `INSERT INTO oauth_providers (user_id, provider, provider_user_id, provider_email, provider_name, provider_avatar_url, access_token, refresh_token, token_expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() + INTERVAL '1 hour')
       RETURNING *`,
      [userId, provider, providerUserId, email, providerName, avatarUrl, accessToken, refreshToken]
    );

    // Update user's avatar if not set
    await client.query(
      'UPDATE users SET avatar_url = COALESCE(avatar_url, $1), updated_at = NOW() WHERE id = $2',
      [avatarUrl, userId]
    );

    await client.query('COMMIT');

    return mapRowToOAuthProvider(newProviderResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Map database row to User object
 */
function mapRowToUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatar_url: row.avatar_url,
    role: row.role,
    is_active: row.is_active,
    email_verified: row.email_verified,
    email_verified_at: row.email_verified_at?.toISOString() || null,
    last_login_at: row.last_login_at?.toISOString() || null,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString()
  };
}

/**
 * Map database row to OAuthProvider object
 */
function mapRowToOAuthProvider(row: any): OAuthProvider {
  return {
    id: row.id,
    user_id: row.user_id,
    provider: row.provider,
    provider_user_id: row.provider_user_id,
    provider_email: row.provider_email,
    provider_name: row.provider_name,
    provider_avatar_url: row.provider_avatar_url,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString()
  };
}
