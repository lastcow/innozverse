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
