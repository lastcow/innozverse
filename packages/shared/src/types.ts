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

export type UserRole =
  | 'admin'
  | 'super_user'
  | 'guest'
  | 'subscription_1'
  | 'subscription_2'
  | 'subscription_3'
  | 'subscription_4'
  | 'subscription_5'
  | 'freebie';

export type UserStatus = 'invited' | 'active' | 'suspended' | 'deleted';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  status: UserStatus;
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

// ==================== User Management Types ====================

export interface ListUsersRequest {
  page?: number;
  limit?: number;
  role?: UserRole;
  search?: string;
}

export interface ListUsersResponse {
  status: 'ok';
  data: {
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface GetUserResponse {
  status: 'ok';
  data: {
    user: UserWithProviders;
  };
}

export interface UpdateUserRequest {
  name?: string;
  role?: UserRole;
  is_active?: boolean;
}

export interface UpdateUserResponse {
  status: 'ok';
  data: {
    user: User;
  };
}

export interface DeleteUserResponse {
  status: 'ok';
  data: {
    message: string;
  };
}

export interface InviteUserRequest {
  email: string;
  name: string;
  role: UserRole;
}

export interface InviteUserResponse {
  status: 'ok';
  data: {
    user: User;
    inviteToken: string;
  };
}
