import {
  HealthResponse,
  healthResponseSchema,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshResponse,
  MeResponse,
  loginRequestSchema,
  registerRequestSchema,
  refreshRequestSchema
} from '@innozverse/shared';

export class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // ==================== Token Management ====================

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  clearTokens(): void {
    this.accessToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('refresh_token');
    }
  }

  setRefreshToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('refresh_token', token);
    }
  }

  getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refresh_token');
    }
    return null;
  }

  // ==================== HTTP Request ====================

  private async request<T>(
    path: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers as Record<string, string>
    };

    // Add authorization header if access token is available
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `API request failed: ${response.status}`
      );
    }

    return response.json();
  }

  // ==================== Health Check ====================

  async getHealth(): Promise<HealthResponse> {
    const data = await this.request<HealthResponse>('/health');
    return healthResponseSchema.parse(data);
  }

  // ==================== Email/Password Authentication ====================

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const validated = registerRequestSchema.parse(data);
    const response = await this.request<RegisterResponse>('/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(validated)
    });

    // Automatically set tokens
    this.setAccessToken(response.data.tokens.access_token);
    this.setRefreshToken(response.data.tokens.refresh_token);

    return response;
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    const validated = loginRequestSchema.parse(data);
    const response = await this.request<LoginResponse>('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(validated)
    });

    // Automatically set tokens
    this.setAccessToken(response.data.tokens.access_token);
    this.setRefreshToken(response.data.tokens.refresh_token);

    return response;
  }

  async refresh(): Promise<RefreshResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const validated = refreshRequestSchema.parse({ refresh_token: refreshToken });
    const response = await this.request<RefreshResponse>('/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify(validated)
    });

    // Update access token
    this.setAccessToken(response.data.tokens.access_token);

    return response;
  }

  async getMe(): Promise<MeResponse> {
    return this.request<MeResponse>('/v1/auth/me');
  }

  async logout(): Promise<void> {
    await this.request<{ status: string }>('/v1/auth/logout', {
      method: 'POST'
    });
    this.clearTokens();
  }

  // ==================== OAuth ====================

  getGoogleAuthUrl(): string {
    return `${this.baseUrl}/v1/auth/google`;
  }

  getGitHubAuthUrl(): string {
    return `${this.baseUrl}/v1/auth/github`;
  }

  handleOAuthCallback(url: string): { accessToken: string; refreshToken: string; isNewUser: boolean } | null {
    try {
      const urlObj = new URL(url);
      const accessToken = urlObj.searchParams.get('access_token');
      const refreshToken = urlObj.searchParams.get('refresh_token');
      const isNewUser = urlObj.searchParams.get('is_new_user') === 'true';

      if (!accessToken || !refreshToken) {
        return null;
      }

      // Automatically set tokens
      this.setAccessToken(accessToken);
      this.setRefreshToken(refreshToken);

      return { accessToken, refreshToken, isNewUser };
    } catch (error) {
      console.error('Failed to parse OAuth callback URL:', error);
      return null;
    }
  }
}

export * from '@innozverse/shared';
