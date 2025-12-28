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

// ==================== Equipment Schemas ====================

export const equipmentCategorySchema = z.enum([
  'laptop',
  'desktop',
  'monitor',
  'keyboard',
  'mouse',
  'headset',
  'gaming_console',
  'controller',
  'peripheral'
]);

export const equipmentStatusSchema = z.enum([
  'available',
  'rented',
  'maintenance',
  'retired'
]);

export const equipmentConditionSchema = z.enum(['excellent', 'good', 'fair']);

export const equipmentSpecsSchema = z.record(z.union([z.string(), z.number(), z.boolean()]));

export const equipmentSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  category: equipmentCategorySchema,
  brand: z.string().nullable(),
  model: z.string().nullable(),
  serial_number: z.string().nullable(),
  daily_rate: z.string(),
  image_url: z.string().nullable(),
  specs: equipmentSpecsSchema.nullable(),
  status: equipmentStatusSchema,
  condition: equipmentConditionSchema,
  purchase_date: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string()
});

export const createEquipmentRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  description: z.string().max(2000, 'Description is too long').optional(),
  category: equipmentCategorySchema,
  brand: z.string().max(100, 'Brand is too long').optional(),
  model: z.string().max(100, 'Model is too long').optional(),
  serial_number: z.string().max(100, 'Serial number is too long').optional(),
  daily_rate: z.number().positive('Daily rate must be positive'),
  image_url: z.string().url('Invalid image URL').optional(),
  specs: equipmentSpecsSchema.optional(),
  condition: equipmentConditionSchema.optional(),
  purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  notes: z.string().max(2000, 'Notes are too long').optional()
});

export const updateEquipmentRequestSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  category: equipmentCategorySchema.optional(),
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  serial_number: z.string().max(100).optional(),
  daily_rate: z.number().positive().optional(),
  image_url: z.string().url().optional(),
  specs: equipmentSpecsSchema.optional(),
  status: equipmentStatusSchema.optional(),
  condition: equipmentConditionSchema.optional(),
  notes: z.string().max(2000).optional()
});

// ==================== Rental Schemas ====================

export const rentalStatusSchema = z.enum([
  'pending',
  'confirmed',
  'active',
  'completed',
  'cancelled',
  'overdue'
]);

export const rentalSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  equipment_id: z.string().uuid(),
  start_date: z.string(),
  end_date: z.string(),
  daily_rate: z.string(),
  total_amount: z.string(),
  status: rentalStatusSchema,
  notes: z.string().nullable(),
  pickup_date: z.string().nullable(),
  return_date: z.string().nullable(),
  cancelled_at: z.string().nullable(),
  cancelled_reason: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string()
});

export const createRentalRequestSchema = z.object({
  equipment_id: z.string().uuid('Invalid equipment ID'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  notes: z.string().max(1000, 'Notes are too long').optional()
}).refine(
  (data) => new Date(data.end_date) >= new Date(data.start_date),
  { message: 'End date must be on or after start date', path: ['end_date'] }
);

export const updateRentalRequestSchema = z.object({
  status: rentalStatusSchema.optional(),
  notes: z.string().max(1000).optional(),
  cancelled_reason: z.string().max(500).optional()
});
