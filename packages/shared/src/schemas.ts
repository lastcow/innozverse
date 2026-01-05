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

export const equipmentConditionSchema = z.enum(['new', 'excellent', 'good', 'fair']);

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
  retail_price: z.string().nullable(),
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
  retail_price: z.number().positive('Retail price must be positive').optional(),
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
  retail_price: z.number().positive().optional(),
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
  user_id: z.string().uuid('Invalid user ID').optional(),
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

// ==================== Knowledge Base Schemas ====================

export const articleStatusSchema = z.enum(['draft', 'published', 'archived']);

export const kbCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  parent_id: z.string().uuid().nullable(),
  sort_order: z.number(),
  icon: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string()
});

export const kbArticleSchema = z.object({
  id: z.string().uuid(),
  category_id: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  summary: z.string().nullable(),
  content: z.string(),
  status: articleStatusSchema,
  author_id: z.string().uuid().nullable(),
  view_count: z.number(),
  is_featured: z.boolean(),
  published_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string()
});

// KB Category Request Schemas

export const createKBCategoryRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  slug: z.string().max(255).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only').optional(),
  description: z.string().max(2000, 'Description is too long').optional(),
  parent_id: z.string().uuid('Invalid parent category ID').optional(),
  sort_order: z.number().int().min(0).optional(),
  icon: z.string().max(50, 'Icon name is too long').optional(),
  is_active: z.boolean().optional()
});

export const updateKBCategoryRequestSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().max(255).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only').optional(),
  description: z.string().max(2000).optional(),
  parent_id: z.string().uuid().nullable().optional(),
  sort_order: z.number().int().min(0).optional(),
  icon: z.string().max(50).optional(),
  is_active: z.boolean().optional()
});

// KB Article Request Schemas

export const createKBArticleRequestSchema = z.object({
  category_id: z.string().uuid('Invalid category ID'),
  title: z.string().min(1, 'Title is required').max(500, 'Title is too long'),
  slug: z.string().max(500).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only').optional(),
  summary: z.string().max(1000, 'Summary is too long').optional(),
  content: z.string().min(1, 'Content is required'),
  status: articleStatusSchema.optional(),
  is_featured: z.boolean().optional()
});

export const importKBArticleRequestSchema = z.object({
  category_id: z.string().uuid('Invalid category ID'),
  title: z.string().min(1, 'Title is required').max(500, 'Title is too long'),
  slug: z.string().max(500).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only').optional(),
  summary: z.string().max(1000, 'Summary is too long').optional(),
  content: z.string().min(1, 'Content is required'),
  status: articleStatusSchema.optional(),
  is_featured: z.boolean().optional()
});

export const updateKBArticleRequestSchema = z.object({
  category_id: z.string().uuid().optional(),
  title: z.string().min(1).max(500).optional(),
  slug: z.string().max(500).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only').optional(),
  summary: z.string().max(1000).optional(),
  content: z.string().min(1).optional(),
  status: articleStatusSchema.optional(),
  is_featured: z.boolean().optional()
});

export const searchKBArticlesRequestSchema = z.object({
  q: z.string().min(2, 'Search query must be at least 2 characters'),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional()
});

// ==================== Product Catalog Schemas ====================

export const pricingPeriodSchema = z.enum(['weekly', 'monthly']);
export const depositStatusSchema = z.enum(['held', 'released', 'forfeited', 'partial_refund']);
export const modifierTypeSchema = z.enum(['discount', 'fee']);

// Product Category Schemas
export const productCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  display_order: z.number(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string()
});

export const createProductCategoryRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  slug: z.string().max(255).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only').optional(),
  description: z.string().max(2000).optional(),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
  display_order: z.number().int().min(0).optional(),
  is_active: z.boolean().optional()
});

export const updateProductCategoryRequestSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().max(255).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(2000).optional(),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
  display_order: z.number().int().min(0).optional(),
  is_active: z.boolean().optional()
});

// Product Color Schema
export const productColorSchema = z.object({
  color_name: z.string().min(1, 'Color name is required').max(100),
  hex_code: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  text_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  border_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  display_order: z.number().int().min(0).optional()
});

// Product Template Schemas
export const productTemplateSchema = z.object({
  id: z.string().uuid(),
  category_id: z.string().uuid(),
  name: z.string(),
  subtitle: z.string().nullable(),
  description: z.string().nullable(),
  weekly_rate: z.string(),
  monthly_rate: z.string(),
  deposit_amount: z.string(),
  specs: z.record(z.union([z.string(), z.number(), z.boolean()])).nullable(),
  screen_size: z.string().nullable(),
  highlights: z.string().nullable(),
  includes: z.array(z.string()).nullable(),
  image_url: z.string().nullable(),
  is_popular: z.boolean(),
  has_accessories: z.boolean(),
  is_new: z.boolean(),
  is_active: z.boolean(),
  display_order: z.number(),
  created_at: z.string(),
  updated_at: z.string()
});

export const createProductTemplateRequestSchema = z.object({
  category_id: z.string().uuid('Invalid category ID'),
  name: z.string().min(1, 'Name is required').max(255),
  subtitle: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
  weekly_rate: z.number().positive('Weekly rate must be positive'),
  monthly_rate: z.number().positive('Monthly rate must be positive'),
  deposit_amount: z.number().positive('Deposit must be positive'),
  specs: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  screen_size: z.string().max(10).optional(),
  highlights: z.string().max(500).optional(),
  includes: z.array(z.string().max(255)).max(20).optional(),
  image_url: z.string().url('Invalid image URL').optional(),
  is_popular: z.boolean().optional(),
  has_accessories: z.boolean().optional(),
  is_new: z.boolean().optional(),
  is_active: z.boolean().optional(),
  display_order: z.number().int().min(0).optional(),
  colors: z.array(productColorSchema).optional()
});

export const updateProductTemplateRequestSchema = z.object({
  category_id: z.string().uuid().optional(),
  name: z.string().min(1).max(255).optional(),
  subtitle: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
  weekly_rate: z.number().positive().optional(),
  monthly_rate: z.number().positive().optional(),
  deposit_amount: z.number().positive().optional(),
  specs: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  screen_size: z.string().max(10).optional(),
  highlights: z.string().max(500).optional(),
  includes: z.array(z.string().max(255)).max(20).optional(),
  image_url: z.string().url().optional(),
  is_popular: z.boolean().optional(),
  has_accessories: z.boolean().optional(),
  is_new: z.boolean().optional(),
  is_active: z.boolean().optional(),
  display_order: z.number().int().min(0).optional()
});

export const addProductColorRequestSchema = productColorSchema;

// Accessory Schemas
export const accessorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  weekly_rate: z.string(),
  monthly_rate: z.string(),
  deposit_amount: z.string(),
  image_url: z.string().nullable(),
  is_active: z.boolean(),
  display_order: z.number(),
  created_at: z.string(),
  updated_at: z.string()
});

export const createAccessoryRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(2000).optional(),
  weekly_rate: z.number().positive('Weekly rate must be positive'),
  monthly_rate: z.number().positive('Monthly rate must be positive'),
  deposit_amount: z.number().positive('Deposit must be positive'),
  image_url: z.string().url('Invalid image URL').optional(),
  is_active: z.boolean().optional(),
  display_order: z.number().int().min(0).optional(),
  colors: z.array(productColorSchema).optional()
});

export const updateAccessoryRequestSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  weekly_rate: z.number().positive().optional(),
  monthly_rate: z.number().positive().optional(),
  deposit_amount: z.number().positive().optional(),
  image_url: z.string().url().optional(),
  is_active: z.boolean().optional(),
  display_order: z.number().int().min(0).optional()
});

// Accessory Link Schema
export const createAccessoryLinkRequestSchema = z.object({
  product_template_id: z.string().uuid().optional(),
  category_id: z.string().uuid().optional(),
  accessory_id: z.string().uuid('Invalid accessory ID'),
  screen_size_filter: z.string().max(10).optional()
}).refine(
  (data) => data.product_template_id || data.category_id,
  { message: 'Either product_template_id or category_id must be provided' }
);

// Inventory Item Schemas
export const inventoryItemSchema = z.object({
  id: z.string().uuid(),
  product_template_id: z.string().uuid().nullable(),
  accessory_id: z.string().uuid().nullable(),
  serial_number: z.string().nullable(),
  color: z.string().nullable(),
  status: equipmentStatusSchema,
  condition: equipmentConditionSchema,
  purchase_date: z.string().nullable(),
  purchase_price: z.string().nullable(),
  retail_price: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string()
});

export const createInventoryItemRequestSchema = z.object({
  product_template_id: z.string().uuid().optional(),
  accessory_id: z.string().uuid().optional(),
  serial_number: z.string().max(100).optional(),
  color: z.string().max(100).optional(),
  status: equipmentStatusSchema.optional(),
  condition: equipmentConditionSchema.optional(),
  purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  purchase_price: z.number().positive().optional(),
  retail_price: z.number().positive().optional(),
  notes: z.string().max(2000).optional()
}).refine(
  (data) => !(data.product_template_id && data.accessory_id),
  { message: 'Cannot set both product_template_id and accessory_id' }
);

export const updateInventoryItemRequestSchema = z.object({
  product_template_id: z.string().uuid().nullable().optional(),
  accessory_id: z.string().uuid().nullable().optional(),
  serial_number: z.string().max(100).optional(),
  color: z.string().max(100).optional(),
  status: equipmentStatusSchema.optional(),
  condition: equipmentConditionSchema.optional(),
  purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  purchase_price: z.number().positive().optional(),
  retail_price: z.number().positive().optional(),
  notes: z.string().max(2000).optional()
});

// Enhanced Rental Schemas
export const createEnhancedRentalRequestSchema = z.object({
  product_template_id: z.string().uuid('Invalid product ID'),
  user_id: z.string().uuid().optional(),
  selected_color: z.string().min(1, 'Color selection is required').max(100),
  pricing_period: pricingPeriodSchema,
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  accessories: z.array(z.object({
    accessory_id: z.string().uuid('Invalid accessory ID'),
    selected_color: z.string().max(100).optional()
  })).optional(),
  notes: z.string().max(1000).optional()
}).refine(
  (data) => new Date(data.end_date) >= new Date(data.start_date),
  { message: 'End date must be on or after start date', path: ['end_date'] }
);

export const rentalPricingRequestSchema = z.object({
  product_template_id: z.string().uuid('Invalid product ID'),
  pricing_period: pricingPeriodSchema,
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  accessories: z.array(z.object({
    accessory_id: z.string().uuid()
  })).optional(),
  apply_student_discount: z.boolean().optional()
});

export const addRentalAccessoryRequestSchema = z.object({
  accessory_id: z.string().uuid('Invalid accessory ID'),
  selected_color: z.string().max(100).optional()
});

export const assignInventoryRequestSchema = z.object({
  inventory_item_id: z.string().uuid('Invalid inventory item ID'),
  accessory_inventory_assignments: z.array(z.object({
    rental_accessory_id: z.string().uuid(),
    inventory_item_id: z.string().uuid()
  })).optional()
});

// Product Availability Check
export const checkProductAvailabilityRequestSchema = z.object({
  product_template_id: z.string().uuid('Invalid product ID'),
  color: z.string().max(100).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});
