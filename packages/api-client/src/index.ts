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

  // ==================== Knowledge Base Categories ====================

  async listKBCategories(params?: {
    parent_id?: string;
    include_children?: boolean;
    include_article_count?: boolean;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.parent_id !== undefined) queryParams.set('parent_id', params.parent_id);
    if (params?.include_children) queryParams.set('include_children', 'true');
    if (params?.include_article_count) queryParams.set('include_article_count', 'true');

    const query = queryParams.toString();
    return this.request(`/v1/kb/categories${query ? `?${query}` : ''}`);
  }

  async getKBCategory(id: string): Promise<any> {
    return this.request(`/v1/kb/categories/${id}`);
  }

  async createKBCategory(data: {
    name: string;
    slug?: string;
    description?: string;
    parent_id?: string;
    sort_order?: number;
    icon?: string;
    is_active?: boolean;
  }): Promise<any> {
    return this.request('/v1/kb/categories', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateKBCategory(
    id: string,
    data: {
      name?: string;
      slug?: string;
      description?: string;
      parent_id?: string | null;
      sort_order?: number;
      icon?: string;
      is_active?: boolean;
    }
  ): Promise<any> {
    return this.request(`/v1/kb/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteKBCategory(id: string): Promise<any> {
    return this.request(`/v1/kb/categories/${id}`, {
      method: 'DELETE'
    });
  }

  // ==================== Knowledge Base Articles ====================

  async listKBArticles(params?: {
    page?: number;
    limit?: number;
    category_id?: string;
    status?: string;
    search?: string;
    is_featured?: boolean;
    author_id?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.category_id) queryParams.set('category_id', params.category_id);
    if (params?.status) queryParams.set('status', params.status);
    if (params?.search) queryParams.set('search', params.search);
    if (params?.is_featured !== undefined) queryParams.set('is_featured', params.is_featured.toString());
    if (params?.author_id) queryParams.set('author_id', params.author_id);

    const query = queryParams.toString();
    return this.request(`/v1/kb/articles${query ? `?${query}` : ''}`);
  }

  async searchKBArticles(query: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    queryParams.set('q', query);
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());

    return this.request(`/v1/kb/articles/search?${queryParams.toString()}`);
  }

  async getKBArticle(id: string): Promise<any> {
    return this.request(`/v1/kb/articles/${id}`);
  }

  async getKBArticleBySlug(slug: string): Promise<any> {
    return this.request(`/v1/kb/articles/slug/${slug}`);
  }

  async createKBArticle(data: {
    category_id: string;
    title: string;
    slug?: string;
    summary?: string;
    content: string;
    status?: string;
    is_featured?: boolean;
  }): Promise<any> {
    return this.request('/v1/kb/articles', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async importKBArticle(data: {
    category_id: string;
    title: string;
    slug?: string;
    summary?: string;
    content: string;
    status?: string;
    is_featured?: boolean;
  }): Promise<any> {
    return this.request('/v1/kb/articles/import', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateKBArticle(
    id: string,
    data: {
      category_id?: string;
      title?: string;
      slug?: string;
      summary?: string;
      content?: string;
      status?: string;
      is_featured?: boolean;
    }
  ): Promise<any> {
    return this.request(`/v1/kb/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteKBArticle(id: string): Promise<any> {
    return this.request(`/v1/kb/articles/${id}`, {
      method: 'DELETE'
    });
  }

  async incrementKBArticleView(id: string): Promise<any> {
    return this.request(`/v1/kb/articles/${id}/view`, {
      method: 'POST'
    });
  }

  // ==================== Product Catalog - Categories ====================

  async listProductCategories(): Promise<any> {
    return this.request('/v1/catalog/categories');
  }

  async getProductCategoryBySlug(slug: string): Promise<any> {
    return this.request(`/v1/catalog/categories/${slug}`);
  }

  async listAdminCategories(params?: {
    page?: number;
    limit?: number;
    is_active?: boolean;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.is_active !== undefined) queryParams.set('is_active', params.is_active.toString());

    const query = queryParams.toString();
    return this.request(`/v1/admin/categories${query ? `?${query}` : ''}`);
  }

  async createProductCategory(data: {
    name: string;
    slug?: string;
    description?: string;
    icon?: string;
    color?: string;
    display_order?: number;
    is_active?: boolean;
  }): Promise<any> {
    return this.request('/v1/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateProductCategory(id: string, data: {
    name?: string;
    slug?: string;
    description?: string;
    icon?: string;
    color?: string;
    display_order?: number;
    is_active?: boolean;
  }): Promise<any> {
    return this.request(`/v1/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteProductCategory(id: string): Promise<any> {
    return this.request(`/v1/admin/categories/${id}`, {
      method: 'DELETE'
    });
  }

  // ==================== Product Catalog - Products ====================

  async listProducts(params?: {
    page?: number;
    limit?: number;
    category_id?: string;
    search?: string;
    include_colors?: boolean;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.category_id) queryParams.set('category_id', params.category_id);
    if (params?.search) queryParams.set('search', params.search);
    if (params?.include_colors) queryParams.set('include_colors', 'true');

    const query = queryParams.toString();
    return this.request(`/v1/catalog/products${query ? `?${query}` : ''}`);
  }

  async getProduct(id: string): Promise<any> {
    return this.request(`/v1/catalog/products/${id}`);
  }

  async listAdminProducts(params?: {
    page?: number;
    limit?: number;
    category_id?: string;
    is_active?: boolean;
    search?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.category_id) queryParams.set('category_id', params.category_id);
    if (params?.is_active !== undefined) queryParams.set('is_active', params.is_active.toString());
    if (params?.search) queryParams.set('search', params.search);

    const query = queryParams.toString();
    return this.request(`/v1/admin/products${query ? `?${query}` : ''}`);
  }

  async getAdminProduct(id: string): Promise<any> {
    return this.request(`/v1/admin/products/${id}`);
  }

  async createProduct(data: {
    category_id: string;
    name: string;
    subtitle?: string;
    description?: string;
    weekly_rate: number;
    monthly_rate: number;
    deposit_amount: number;
    specs?: Record<string, string | number | boolean>;
    screen_size?: string;
    highlights?: string;
    includes?: string[];
    image_url?: string;
    is_popular?: boolean;
    has_accessories?: boolean;
    is_new?: boolean;
    is_active?: boolean;
    display_order?: number;
    colors?: Array<{
      color_name: string;
      hex_code?: string;
      text_color?: string;
      border_color?: string;
      display_order?: number;
    }>;
  }): Promise<any> {
    return this.request('/v1/admin/products', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateProduct(id: string, data: {
    category_id?: string;
    name?: string;
    subtitle?: string;
    description?: string;
    weekly_rate?: number;
    monthly_rate?: number;
    deposit_amount?: number;
    specs?: Record<string, string | number | boolean>;
    screen_size?: string;
    highlights?: string;
    includes?: string[];
    image_url?: string;
    is_popular?: boolean;
    has_accessories?: boolean;
    is_new?: boolean;
    is_active?: boolean;
    display_order?: number;
  }): Promise<any> {
    return this.request(`/v1/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteProduct(id: string): Promise<any> {
    return this.request(`/v1/admin/products/${id}`, {
      method: 'DELETE'
    });
  }

  async addProductColor(productId: string, data: {
    color_name: string;
    hex_code?: string;
    text_color?: string;
    border_color?: string;
    display_order?: number;
  }): Promise<any> {
    return this.request(`/v1/admin/products/${productId}/colors`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async deleteProductColor(productId: string, colorId: string): Promise<any> {
    return this.request(`/v1/admin/products/${productId}/colors/${colorId}`, {
      method: 'DELETE'
    });
  }

  // ==================== Accessories ====================

  async listAccessories(): Promise<any> {
    return this.request('/v1/catalog/accessories');
  }

  async getAccessory(id: string): Promise<any> {
    return this.request(`/v1/catalog/accessories/${id}`);
  }

  async listAdminAccessories(params?: {
    page?: number;
    limit?: number;
    is_active?: boolean;
    search?: string;
    include_colors?: boolean;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.is_active !== undefined) queryParams.set('is_active', params.is_active.toString());
    if (params?.search) queryParams.set('search', params.search);
    if (params?.include_colors) queryParams.set('include_colors', 'true');

    const query = queryParams.toString();
    return this.request(`/v1/admin/accessories${query ? `?${query}` : ''}`);
  }

  async getAdminAccessory(id: string): Promise<any> {
    return this.request(`/v1/admin/accessories/${id}`);
  }

  async createAccessory(data: {
    name: string;
    description?: string;
    weekly_rate: number;
    monthly_rate: number;
    deposit_amount: number;
    image_url?: string;
    is_active?: boolean;
    display_order?: number;
    colors?: Array<{
      color_name: string;
      hex_code?: string;
      text_color?: string;
      border_color?: string;
      display_order?: number;
    }>;
  }): Promise<any> {
    return this.request('/v1/admin/accessories', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateAccessory(id: string, data: {
    name?: string;
    description?: string;
    weekly_rate?: number;
    monthly_rate?: number;
    deposit_amount?: number;
    image_url?: string;
    is_active?: boolean;
    display_order?: number;
  }): Promise<any> {
    return this.request(`/v1/admin/accessories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteAccessory(id: string): Promise<any> {
    return this.request(`/v1/admin/accessories/${id}`, {
      method: 'DELETE'
    });
  }

  async addAccessoryColor(accessoryId: string, data: {
    color_name: string;
    hex_code?: string;
    text_color?: string;
    border_color?: string;
    display_order?: number;
  }): Promise<any> {
    return this.request(`/v1/admin/accessories/${accessoryId}/colors`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async deleteAccessoryColor(accessoryId: string, colorId: string): Promise<any> {
    return this.request(`/v1/admin/accessories/${accessoryId}/colors/${colorId}`, {
      method: 'DELETE'
    });
  }

  // Accessory Links
  async listAccessoryLinks(params?: {
    accessory_id?: string;
    product_template_id?: string;
    category_id?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.accessory_id) queryParams.set('accessory_id', params.accessory_id);
    if (params?.product_template_id) queryParams.set('product_template_id', params.product_template_id);
    if (params?.category_id) queryParams.set('category_id', params.category_id);

    const query = queryParams.toString();
    return this.request(`/v1/admin/accessory-links${query ? `?${query}` : ''}`);
  }

  async createAccessoryLink(data: {
    product_template_id?: string;
    category_id?: string;
    accessory_id: string;
    screen_size_filter?: string;
  }): Promise<any> {
    return this.request('/v1/admin/accessory-links', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async deleteAccessoryLink(linkId: string): Promise<any> {
    return this.request(`/v1/admin/accessory-links/${linkId}`, {
      method: 'DELETE'
    });
  }

  async getAccessoryLinks(accessoryId: string): Promise<any> {
    return this.listAccessoryLinks({ accessory_id: accessoryId });
  }

  // ==================== Inventory ====================

  async listInventory(params?: {
    page?: number;
    limit?: number;
    product_template_id?: string;
    accessory_id?: string;
    status?: string;
    condition?: string;
    color?: string;
    search?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.product_template_id) queryParams.set('product_template_id', params.product_template_id);
    if (params?.accessory_id) queryParams.set('accessory_id', params.accessory_id);
    if (params?.status) queryParams.set('status', params.status);
    if (params?.condition) queryParams.set('condition', params.condition);
    if (params?.color) queryParams.set('color', params.color);
    if (params?.search) queryParams.set('search', params.search);

    const query = queryParams.toString();
    return this.request(`/v1/admin/inventory${query ? `?${query}` : ''}`);
  }

  async getInventoryItem(id: string): Promise<any> {
    return this.request(`/v1/admin/inventory/${id}`);
  }

  async getInventorySummary(): Promise<any> {
    return this.request('/v1/admin/inventory/summary');
  }

  async createInventoryItem(data: {
    product_template_id?: string;
    accessory_id?: string;
    serial_number?: string;
    color?: string;
    status?: string;
    condition?: string;
    purchase_date?: string;
    purchase_price?: number;
    retail_price?: number;
    notes?: string;
  }): Promise<any> {
    return this.request('/v1/admin/inventory', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateInventoryItem(id: string, data: {
    product_template_id?: string | null;
    accessory_id?: string | null;
    serial_number?: string;
    color?: string;
    status?: string;
    condition?: string;
    purchase_date?: string;
    purchase_price?: number;
    retail_price?: number;
    notes?: string;
  }): Promise<any> {
    return this.request(`/v1/admin/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteInventoryItem(id: string): Promise<any> {
    return this.request(`/v1/admin/inventory/${id}`, {
      method: 'DELETE'
    });
  }

  async bulkCreateInventory(items: Array<{
    product_template_id?: string;
    accessory_id?: string;
    serial_number?: string;
    color?: string;
    status?: string;
    condition?: string;
    purchase_date?: string;
    purchase_price?: number;
    retail_price?: number;
    notes?: string;
  }>): Promise<any> {
    return this.request('/v1/admin/inventory/bulk', {
      method: 'POST',
      body: JSON.stringify({ items })
    });
  }

  async checkInventoryAvailability(params: {
    product_template_id?: string;
    accessory_id?: string;
    color?: string;
    start_date: string;
    end_date: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params.product_template_id) queryParams.set('product_template_id', params.product_template_id);
    if (params.accessory_id) queryParams.set('accessory_id', params.accessory_id);
    if (params.color) queryParams.set('color', params.color);
    queryParams.set('start_date', params.start_date);
    queryParams.set('end_date', params.end_date);

    return this.request(`/v1/inventory/availability?${queryParams.toString()}`);
  }

  // ==================== Enhanced Rentals ====================

  async calculateRentalPricing(params: {
    product_template_id: string;
    pricing_period: 'weekly' | 'monthly';
    start_date: string;
    end_date: string;
    accessories?: Array<{ accessory_id: string }>;
    apply_student_discount?: boolean;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    queryParams.set('product_template_id', params.product_template_id);
    queryParams.set('pricing_period', params.pricing_period);
    queryParams.set('start_date', params.start_date);
    queryParams.set('end_date', params.end_date);
    if (params.accessories) queryParams.set('accessories', JSON.stringify(params.accessories));
    if (params.apply_student_discount) queryParams.set('apply_student_discount', 'true');

    return this.request(`/v1/rentals/calculate-pricing?${queryParams.toString()}`);
  }

  async createEnhancedRental(data: {
    product_template_id: string;
    user_id?: string;
    selected_color?: string;
    pricing_period: 'weekly' | 'monthly';
    start_date: string;
    end_date: string;
    accessories?: Array<{
      accessory_id: string;
      selected_color?: string;
    }>;
    notes?: string;
  }): Promise<any> {
    return this.request('/v1/rentals/enhanced', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getRentalDetails(id: string): Promise<any> {
    return this.request(`/v1/rentals/${id}/details`);
  }

  async addRentalAccessory(rentalId: string, data: {
    accessory_id: string;
    selected_color?: string;
  }): Promise<any> {
    return this.request(`/v1/rentals/${rentalId}/accessories`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async assignRentalInventory(rentalId: string, data: {
    inventory_item_id: string;
    accessory_inventory_assignments?: Array<{
      rental_accessory_id: string;
      inventory_item_id: string;
    }>;
  }): Promise<any> {
    return this.request(`/v1/rentals/${rentalId}/assign-inventory`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async releaseRentalDeposit(rentalId: string, notes?: string): Promise<any> {
    return this.request(`/v1/rentals/${rentalId}/release-deposit`, {
      method: 'POST',
      body: JSON.stringify({ notes })
    });
  }

  async getPricingModifiers(): Promise<any> {
    return this.request('/v1/pricing-modifiers');
  }
}

export * from '@innozverse/shared';
