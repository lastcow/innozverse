export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

// ==================== Authentication & User Types ====================

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

export interface RefreshRequest {
  refresh_token: string;
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

export interface RefreshResponse {
  status: 'ok';
  data: {
    tokens: AuthTokens;
  };
}

// ==================== OAuth Types ====================

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
