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
      ...options?.headers as Record<string, string>
    };

    // Only set Content-Type if there's a body
    if (options?.body) {
      headers['Content-Type'] = 'application/json';
    }

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

  // Public HTTP methods
  async get<T = any>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  async post<T = any>(path: string, data?: any): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async put<T = any>(path: string, data?: any): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async delete<T = any>(path: string): Promise<T> {
    return this.request<T>(path, {
      method: 'DELETE'
    });
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

  // ==================== User Management ====================

  async listUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.role) queryParams.set('role', params.role);
    if (params?.search) queryParams.set('search', params.search);

    const query = queryParams.toString();
    return this.request(`/v1/users${query ? `?${query}` : ''}`);
  }

  async getUser(id: string): Promise<any> {
    return this.request(`/v1/users/${id}`);
  }

  async updateUser(id: string, data: {
    name?: string;
    role?: string;
    is_active?: boolean;
  }): Promise<any> {
    return this.request(`/v1/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteUser(id: string): Promise<any> {
    return this.request(`/v1/users/${id}`, {
      method: 'DELETE'
    });
  }

  async inviteUser(data: {
    email: string;
    name: string;
    role: string;
  }): Promise<any> {
    return this.request('/v1/users/invite', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // ==================== Equipment Management ====================

  async listEquipment(params?: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    search?: string;
    min_rate?: number;
    max_rate?: number;
    available_from?: string;
    available_to?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.category) queryParams.set('category', params.category);
    if (params?.status) queryParams.set('status', params.status);
    if (params?.search) queryParams.set('search', params.search);
    if (params?.min_rate) queryParams.set('min_rate', params.min_rate.toString());
    if (params?.max_rate) queryParams.set('max_rate', params.max_rate.toString());
    if (params?.available_from) queryParams.set('available_from', params.available_from);
    if (params?.available_to) queryParams.set('available_to', params.available_to);

    const query = queryParams.toString();
    return this.request(`/v1/equipment${query ? `?${query}` : ''}`);
  }

  async getEquipment(id: string): Promise<any> {
    return this.request(`/v1/equipment/${id}`);
  }

  async checkEquipmentAvailability(
    id: string,
    startDate: string,
    endDate: string
  ): Promise<any> {
    return this.request(
      `/v1/equipment/${id}/availability?start_date=${startDate}&end_date=${endDate}`
    );
  }

  async createEquipment(data: {
    name: string;
    description?: string;
    category: string;
    brand?: string;
    model?: string;
    serial_number?: string;
    daily_rate: number;
    image_url?: string;
    specs?: Record<string, string | number | boolean>;
    condition?: string;
    purchase_date?: string;
    notes?: string;
  }): Promise<any> {
    return this.request('/v1/equipment', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateEquipment(
    id: string,
    data: {
      name?: string;
      description?: string;
      category?: string;
      brand?: string;
      model?: string;
      serial_number?: string;
      daily_rate?: number;
      image_url?: string;
      specs?: Record<string, string | number | boolean>;
      status?: string;
      condition?: string;
      notes?: string;
    }
  ): Promise<any> {
    return this.request(`/v1/equipment/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteEquipment(id: string): Promise<any> {
    return this.request(`/v1/equipment/${id}`, {
      method: 'DELETE'
    });
  }

  // ==================== Rental Management ====================

  async listRentals(params?: {
    page?: number;
    limit?: number;
    status?: string;
    user_id?: string;
    equipment_id?: string;
    start_date_from?: string;
    start_date_to?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.status) queryParams.set('status', params.status);
    if (params?.user_id) queryParams.set('user_id', params.user_id);
    if (params?.equipment_id) queryParams.set('equipment_id', params.equipment_id);
    if (params?.start_date_from) queryParams.set('start_date_from', params.start_date_from);
    if (params?.start_date_to) queryParams.set('start_date_to', params.start_date_to);

    const query = queryParams.toString();
    return this.request(`/v1/rentals${query ? `?${query}` : ''}`);
  }

  async getMyRentals(): Promise<any> {
    return this.request('/v1/rentals/my');
  }

  async getRental(id: string): Promise<any> {
    return this.request(`/v1/rentals/${id}`);
  }

  async createRental(data: {
    equipment_id: string;
    user_id?: string;
    start_date: string;
    end_date: string;
    notes?: string;
  }): Promise<any> {
    return this.request('/v1/rentals', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateRental(
    id: string,
    data: {
      status?: string;
      notes?: string;
      cancelled_reason?: string;
    }
  ): Promise<any> {
    return this.request(`/v1/rentals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async cancelRental(id: string, reason?: string): Promise<any> {
    return this.request(`/v1/rentals/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  async confirmRental(id: string): Promise<any> {
    return this.request(`/v1/rentals/${id}/confirm`, {
      method: 'POST'
    });
  }

  async pickupRental(id: string): Promise<any> {
    return this.request(`/v1/rentals/${id}/pickup`, {
      method: 'POST'
    });
  }

  async returnRental(id: string): Promise<any> {
    return this.request(`/v1/rentals/${id}/return`, {
      method: 'POST'
    });
  }
}

export * from '@innozverse/shared';
