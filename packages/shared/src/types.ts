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

// ==================== Equipment Types ====================

export type EquipmentCategory =
  | 'laptop'
  | 'desktop'
  | 'monitor'
  | 'keyboard'
  | 'mouse'
  | 'headset'
  | 'gaming_console'
  | 'controller'
  | 'peripheral';

export type EquipmentStatus = 'available' | 'rented' | 'maintenance' | 'retired';

export type EquipmentCondition = 'excellent' | 'good' | 'fair';

export interface EquipmentSpecs {
  [key: string]: string | number | boolean;
}

export interface Equipment {
  id: string;
  name: string;
  description: string | null;
  category: EquipmentCategory;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  daily_rate: string;
  retail_price: string | null;
  image_url: string | null;
  specs: EquipmentSpecs | null;
  status: EquipmentStatus;
  condition: EquipmentCondition;
  purchase_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEquipmentRequest {
  name: string;
  description?: string;
  category: EquipmentCategory;
  brand?: string;
  model?: string;
  serial_number?: string;
  daily_rate: number;
  retail_price?: number;
  image_url?: string;
  specs?: EquipmentSpecs;
  condition?: EquipmentCondition;
  purchase_date?: string;
  notes?: string;
}

export interface UpdateEquipmentRequest {
  name?: string;
  description?: string;
  category?: EquipmentCategory;
  brand?: string;
  model?: string;
  serial_number?: string;
  daily_rate?: number;
  retail_price?: number;
  image_url?: string;
  specs?: EquipmentSpecs;
  status?: EquipmentStatus;
  condition?: EquipmentCondition;
  notes?: string;
}

export interface ListEquipmentRequest {
  page?: number;
  limit?: number;
  category?: EquipmentCategory;
  status?: EquipmentStatus;
  search?: string;
  min_rate?: number;
  max_rate?: number;
  available_from?: string;
  available_to?: string;
}

export interface ListEquipmentResponse {
  status: 'ok';
  data: {
    equipment: Equipment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface GetEquipmentResponse {
  status: 'ok';
  data: {
    equipment: Equipment;
  };
}

export interface CreateEquipmentResponse {
  status: 'created';
  data: {
    equipment: Equipment;
  };
}

export interface UpdateEquipmentResponse {
  status: 'ok';
  data: {
    equipment: Equipment;
  };
}

export interface DeleteEquipmentResponse {
  status: 'ok';
  data: {
    message: string;
  };
}

export interface CheckAvailabilityRequest {
  equipment_id: string;
  start_date: string;
  end_date: string;
}

export interface CheckAvailabilityResponse {
  status: 'ok';
  data: {
    available: boolean;
    conflicting_rentals?: { start_date: string; end_date: string }[];
  };
}

// ==================== Rental Types ====================

export type RentalStatus =
  | 'pending'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'overdue';

export interface Rental {
  id: string;
  user_id: string;
  equipment_id: string;
  start_date: string;
  end_date: string;
  daily_rate: string;
  total_amount: string;
  status: RentalStatus;
  notes: string | null;
  pickup_date: string | null;
  return_date: string | null;
  cancelled_at: string | null;
  cancelled_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface RentalWithDetails extends Rental {
  user: {
    id: string;
    name: string;
    email: string;
  };
  equipment: {
    id: string;
    name: string;
    category: EquipmentCategory;
    image_url: string | null;
  };
}

export interface CreateRentalRequest {
  equipment_id: string;
  start_date: string;
  end_date: string;
  notes?: string;
}

export interface UpdateRentalRequest {
  status?: RentalStatus;
  notes?: string;
  cancelled_reason?: string;
}

export interface ListRentalsRequest {
  page?: number;
  limit?: number;
  status?: RentalStatus;
  user_id?: string;
  equipment_id?: string;
  start_date_from?: string;
  start_date_to?: string;
}

export interface ListRentalsResponse {
  status: 'ok';
  data: {
    rentals: RentalWithDetails[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface GetRentalResponse {
  status: 'ok';
  data: {
    rental: RentalWithDetails;
  };
}

export interface CreateRentalResponse {
  status: 'created';
  data: {
    rental: Rental;
  };
}

export interface UpdateRentalResponse {
  status: 'ok';
  data: {
    rental: Rental;
  };
}

export interface CancelRentalResponse {
  status: 'ok';
  data: {
    rental: Rental;
    message: string;
  };
}

// ==================== Knowledge Base Types ====================

export type ArticleStatus = 'draft' | 'published' | 'archived';

export interface KBCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  sort_order: number;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface KBCategoryWithChildren extends KBCategory {
  children?: KBCategoryWithChildren[];
  article_count?: number;
}

export interface KBArticle {
  id: string;
  category_id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  status: ArticleStatus;
  author_id: string | null;
  view_count: number;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface KBArticleWithDetails extends KBArticle {
  category: {
    id: string;
    name: string;
    slug: string;
  };
  author: {
    id: string;
    name: string;
  } | null;
}

// KB Category Request/Response Types

export interface CreateKBCategoryRequest {
  name: string;
  slug?: string;
  description?: string;
  parent_id?: string;
  sort_order?: number;
  icon?: string;
  is_active?: boolean;
}

export interface UpdateKBCategoryRequest {
  name?: string;
  slug?: string;
  description?: string;
  parent_id?: string | null;
  sort_order?: number;
  icon?: string;
  is_active?: boolean;
}

export interface ListKBCategoriesRequest {
  parent_id?: string;
  include_children?: boolean;
  include_article_count?: boolean;
}

export interface ListKBCategoriesResponse {
  status: 'ok';
  data: {
    categories: KBCategoryWithChildren[];
  };
}

export interface GetKBCategoryResponse {
  status: 'ok';
  data: {
    category: KBCategoryWithChildren;
  };
}

export interface CreateKBCategoryResponse {
  status: 'created';
  data: {
    category: KBCategory;
  };
}

export interface UpdateKBCategoryResponse {
  status: 'ok';
  data: {
    category: KBCategory;
  };
}

export interface DeleteKBCategoryResponse {
  status: 'ok';
  data: {
    message: string;
  };
}

// KB Article Request/Response Types

export interface CreateKBArticleRequest {
  category_id: string;
  title: string;
  slug?: string;
  summary?: string;
  content: string;
  status?: ArticleStatus;
  is_featured?: boolean;
}

export interface ImportKBArticleRequest {
  category_id: string;
  title: string;
  slug?: string;
  summary?: string;
  content: string;
  status?: ArticleStatus;
  is_featured?: boolean;
}

export interface UpdateKBArticleRequest {
  category_id?: string;
  title?: string;
  slug?: string;
  summary?: string;
  content?: string;
  status?: ArticleStatus;
  is_featured?: boolean;
}

export interface ListKBArticlesRequest {
  page?: number;
  limit?: number;
  category_id?: string;
  status?: ArticleStatus;
  search?: string;
  is_featured?: boolean;
  author_id?: string;
}

export interface ListKBArticlesResponse {
  status: 'ok';
  data: {
    articles: KBArticleWithDetails[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface GetKBArticleResponse {
  status: 'ok';
  data: {
    article: KBArticleWithDetails;
  };
}

export interface CreateKBArticleResponse {
  status: 'created';
  data: {
    article: KBArticle;
  };
}

export interface UpdateKBArticleResponse {
  status: 'ok';
  data: {
    article: KBArticle;
  };
}

export interface DeleteKBArticleResponse {
  status: 'ok';
  data: {
    message: string;
  };
}

export interface SearchKBArticlesRequest {
  q: string;
  page?: number;
  limit?: number;
}

export interface SearchKBArticlesResponse {
  status: 'ok';
  data: {
    articles: (KBArticleWithDetails & { rank?: number; highlighted_summary?: string })[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// ==================== Product Catalog Types ====================

export type PricingPeriod = 'weekly' | 'monthly';
export type DepositStatus = 'held' | 'released' | 'forfeited' | 'partial_refund';
export type ModifierType = 'discount' | 'fee';

// Product Category
export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductCategoryWithProducts extends ProductCategory {
  products: ProductTemplate[];
  product_count?: number;
}

// Product Color
export interface ProductColor {
  id: string;
  product_template_id: string;
  color_name: string;
  hex_code: string | null;
  text_color: string | null;
  border_color: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

// Product Template (Variant)
export interface ProductTemplate {
  id: string;
  category_id: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  weekly_rate: string;
  monthly_rate: string;
  deposit_amount: string;
  specs: Record<string, string | number | boolean> | null;
  screen_size: string | null;
  highlights: string | null;
  includes: string[] | null;
  image_url: string | null;
  is_popular: boolean;
  has_accessories: boolean;
  is_new: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductTemplateWithDetails extends ProductTemplate {
  category: ProductCategory;
  colors: ProductColor[];
  available_count: number;
}

// Accessory
export interface Accessory {
  id: string;
  name: string;
  description: string | null;
  weekly_rate: string;
  monthly_rate: string;
  deposit_amount: string;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface AccessoryColor {
  id: string;
  accessory_id: string;
  color_name: string;
  hex_code: string | null;
  text_color: string | null;
  border_color: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface AccessoryWithDetails extends Accessory {
  colors: AccessoryColor[];
  screen_size_filter: string | null;
}

// Product-Accessory Link
export interface ProductAccessoryLink {
  id: string;
  product_template_id: string | null;
  category_id: string | null;
  accessory_id: string;
  screen_size_filter: string | null;
  is_active: boolean;
  created_at: string;
}

// Inventory Item (Physical Unit)
export interface InventoryItem {
  id: string;
  product_template_id: string | null;
  accessory_id: string | null;
  serial_number: string | null;
  color: string | null;
  status: EquipmentStatus;
  condition: EquipmentCondition;
  purchase_date: string | null;
  purchase_price: string | null;
  retail_price: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryItemWithDetails extends InventoryItem {
  product_template?: ProductTemplate;
  accessory?: Accessory;
}

// Rental Accessory (Junction)
export interface RentalAccessory {
  id: string;
  rental_id: string;
  accessory_id: string;
  inventory_item_id: string | null;
  selected_color: string | null;
  weekly_rate: string;
  monthly_rate: string;
  deposit_amount: string;
  deposit_status: DepositStatus;
  created_at: string;
  accessory?: Accessory;
  inventory_item?: InventoryItem;
}

// Enhanced Rental (extends base Rental)
export interface EnhancedRental extends Rental {
  product_template_id: string | null;
  inventory_item_id: string | null;
  selected_color: string | null;
  pricing_period: PricingPeriod | null;
  weekly_rate: string | null;
  monthly_rate: string | null;
  deposit_amount: string | null;
  deposit_status: DepositStatus;
  deposit_released_at: string | null;
  deposit_notes: string | null;
  student_discount_applied: boolean;
  new_equipment_fee_applied: boolean;
  discount_amount: string;
  fee_amount: string;
  final_total: string | null;
}

export interface EnhancedRentalWithDetails extends EnhancedRental {
  user: {
    id: string;
    name: string;
    email: string;
  };
  product_template?: ProductTemplateWithDetails;
  inventory_item?: InventoryItem;
  accessories: RentalAccessory[];
}

// Pricing Modifier
export interface PricingModifier {
  id: string;
  name: string;
  display_name: string;
  type: ModifierType;
  percentage: string;
  applies_to: string;
  requires_verification: boolean;
  is_active: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== Product Catalog Request/Response Types ====================

// Category CRUD
export interface CreateProductCategoryRequest {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  color?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface UpdateProductCategoryRequest {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  color?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface ListProductCategoriesRequest {
  include_products?: boolean;
  is_active?: boolean;
}

export interface ListProductCategoriesResponse {
  status: 'ok';
  data: {
    categories: ProductCategoryWithProducts[];
  };
}

export interface GetProductCategoryResponse {
  status: 'ok';
  data: {
    category: ProductCategoryWithProducts;
  };
}

export interface CreateProductCategoryResponse {
  status: 'created';
  data: {
    category: ProductCategory;
  };
}

export interface UpdateProductCategoryResponse {
  status: 'ok';
  data: {
    category: ProductCategory;
  };
}

export interface DeleteProductCategoryResponse {
  status: 'ok';
  data: {
    message: string;
  };
}

// Product Template CRUD
export interface CreateProductTemplateRequest {
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
  }>;
}

export interface UpdateProductTemplateRequest {
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
}

export interface ListProductTemplatesRequest {
  page?: number;
  limit?: number;
  category_id?: string;
  screen_size?: string;
  is_popular?: boolean;
  is_active?: boolean;
  search?: string;
}

export interface ListProductTemplatesResponse {
  status: 'ok';
  data: {
    products: ProductTemplateWithDetails[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface GetProductTemplateResponse {
  status: 'ok';
  data: {
    product: ProductTemplateWithDetails;
    compatible_accessories: AccessoryWithDetails[];
  };
}

export interface CreateProductTemplateResponse {
  status: 'created';
  data: {
    product: ProductTemplate;
  };
}

export interface UpdateProductTemplateResponse {
  status: 'ok';
  data: {
    product: ProductTemplate;
  };
}

export interface DeleteProductTemplateResponse {
  status: 'ok';
  data: {
    message: string;
  };
}

// Product Color CRUD
export interface AddProductColorRequest {
  color_name: string;
  hex_code?: string;
  text_color?: string;
  border_color?: string;
  display_order?: number;
}

export interface AddProductColorResponse {
  status: 'created';
  data: {
    color: ProductColor;
  };
}

export interface DeleteProductColorResponse {
  status: 'ok';
  data: {
    message: string;
  };
}

// Accessory CRUD
export interface CreateAccessoryRequest {
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
  }>;
}

export interface UpdateAccessoryRequest {
  name?: string;
  description?: string;
  weekly_rate?: number;
  monthly_rate?: number;
  deposit_amount?: number;
  image_url?: string;
  is_active?: boolean;
  display_order?: number;
}

export interface ListAccessoriesRequest {
  page?: number;
  limit?: number;
  is_active?: boolean;
  search?: string;
}

export interface ListAccessoriesResponse {
  status: 'ok';
  data: {
    accessories: AccessoryWithDetails[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface GetAccessoryResponse {
  status: 'ok';
  data: {
    accessory: AccessoryWithDetails;
  };
}

export interface CreateAccessoryResponse {
  status: 'created';
  data: {
    accessory: Accessory;
  };
}

export interface UpdateAccessoryResponse {
  status: 'ok';
  data: {
    accessory: Accessory;
  };
}

export interface DeleteAccessoryResponse {
  status: 'ok';
  data: {
    message: string;
  };
}

// Accessory Link CRUD
export interface CreateAccessoryLinkRequest {
  product_template_id?: string;
  category_id?: string;
  accessory_id: string;
  screen_size_filter?: string;
}

export interface CreateAccessoryLinkResponse {
  status: 'created';
  data: {
    link: ProductAccessoryLink;
  };
}

export interface DeleteAccessoryLinkResponse {
  status: 'ok';
  data: {
    message: string;
  };
}

// Inventory CRUD
export interface CreateInventoryItemRequest {
  product_template_id?: string;
  accessory_id?: string;
  serial_number?: string;
  color?: string;
  status?: EquipmentStatus;
  condition?: EquipmentCondition;
  purchase_date?: string;
  purchase_price?: number;
  retail_price?: number;
  notes?: string;
}

export interface UpdateInventoryItemRequest {
  product_template_id?: string;
  accessory_id?: string;
  serial_number?: string;
  color?: string;
  status?: EquipmentStatus;
  condition?: EquipmentCondition;
  purchase_date?: string;
  purchase_price?: number;
  retail_price?: number;
  notes?: string;
}

export interface ListInventoryItemsRequest {
  page?: number;
  limit?: number;
  product_template_id?: string;
  accessory_id?: string;
  status?: EquipmentStatus;
  color?: string;
  search?: string;
}

export interface ListInventoryItemsResponse {
  status: 'ok';
  data: {
    items: InventoryItemWithDetails[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface GetInventoryItemResponse {
  status: 'ok';
  data: {
    item: InventoryItemWithDetails;
  };
}

export interface CreateInventoryItemResponse {
  status: 'created';
  data: {
    item: InventoryItem;
  };
}

export interface UpdateInventoryItemResponse {
  status: 'ok';
  data: {
    item: InventoryItem;
  };
}

export interface DeleteInventoryItemResponse {
  status: 'ok';
  data: {
    message: string;
  };
}

// Enhanced Rental Request/Response
export interface CreateEnhancedRentalRequest {
  product_template_id: string;
  user_id?: string;
  selected_color: string;
  pricing_period: PricingPeriod;
  start_date: string;
  end_date: string;
  accessories?: Array<{
    accessory_id: string;
    selected_color?: string;
  }>;
  notes?: string;
}

export interface RentalPricingRequest {
  product_template_id: string;
  pricing_period: PricingPeriod;
  start_date: string;
  end_date: string;
  accessories?: Array<{
    accessory_id: string;
  }>;
  apply_student_discount?: boolean;
}

export interface RentalPricingResponse {
  status: 'ok';
  data: {
    product: {
      id: string;
      name: string;
      rate: string;
      deposit: string;
      is_new: boolean;
    };
    accessories: Array<{
      id: string;
      name: string;
      rate: string;
      deposit: string;
    }>;
    subtotal: string;
    total_deposit: string;
    duration_days: number;
    pricing_period: PricingPeriod;
    periods: number;
    base_rental_total: string;
    student_discount?: {
      percentage: string;
      amount: string;
    };
    new_equipment_fee?: {
      percentage: string;
      amount: string;
    };
    final_rental_total: string;
    grand_total: string;
  };
}

export interface CreateEnhancedRentalResponse {
  status: 'created';
  data: {
    rental: EnhancedRentalWithDetails;
  };
}

export interface GetEnhancedRentalResponse {
  status: 'ok';
  data: {
    rental: EnhancedRentalWithDetails;
  };
}

export interface AddRentalAccessoryRequest {
  accessory_id: string;
  selected_color?: string;
}

export interface AddRentalAccessoryResponse {
  status: 'ok';
  data: {
    rental_accessory: RentalAccessory;
  };
}

export interface RemoveRentalAccessoryResponse {
  status: 'ok';
  data: {
    message: string;
  };
}

export interface AssignInventoryRequest {
  inventory_item_id: string;
  accessory_inventory_assignments?: Array<{
    rental_accessory_id: string;
    inventory_item_id: string;
  }>;
}

export interface AssignInventoryResponse {
  status: 'ok';
  data: {
    rental: EnhancedRentalWithDetails;
    message: string;
  };
}

// Product Availability Check
export interface CheckProductAvailabilityRequest {
  product_template_id: string;
  color?: string;
  start_date: string;
  end_date: string;
}

export interface CheckProductAvailabilityResponse {
  status: 'ok';
  data: {
    available: boolean;
    available_count: number;
    available_colors: string[];
  };
}
