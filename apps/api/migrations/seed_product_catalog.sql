-- Seed data for Product Catalog
-- Run this after the product catalog migrations

-- =====================================================
-- 1. Product Categories
-- =====================================================
INSERT INTO product_categories (name, slug, description, icon, color, display_order, is_active) VALUES
('Surface Pro', 'surface-pro', 'Microsoft Surface Pro tablets with detachable keyboards', 'Tablet', 'cyan', 1, true),
('Surface Laptop', 'surface-laptop', 'Microsoft Surface Laptop series', 'Laptop', 'green', 2, true),
('Xbox', 'xbox', 'Xbox gaming consoles and accessories', 'Gamepad2', 'orange', 3, true);

-- =====================================================
-- 2. Product Templates - Surface Pro
-- =====================================================
INSERT INTO product_templates (
  category_id, name, subtitle, description, weekly_rate, monthly_rate, deposit_amount,
  specs, screen_size, highlights, includes, image_url, is_popular, has_accessories, is_new, display_order
)
SELECT
  id,
  'Surface Pro 11',
  '13" Snapdragon X Plus (10 Core) - LCD - WiFi',
  'The most powerful Surface Pro yet, featuring the Snapdragon X Plus processor for all-day battery life and incredible performance.',
  49.00,
  149.00,
  200.00,
  '{"processor": "Snapdragon X Plus (10 Core)", "ram": "16GB", "storage": "256GB SSD", "display": "13\" PixelSense LCD", "battery": "Up to 14 hours"}'::jsonb,
  '13',
  'Perfect for students and professionals who need portability without compromise',
  ARRAY['Surface Pro 11', 'Power adapter', 'Quick start guide'],
  NULL,
  true,
  true,
  true,
  1
FROM product_categories WHERE slug = 'surface-pro';

INSERT INTO product_templates (
  category_id, name, subtitle, description, weekly_rate, monthly_rate, deposit_amount,
  specs, screen_size, highlights, includes, image_url, is_popular, has_accessories, is_new, display_order
)
SELECT
  id,
  'Surface Pro 10',
  '13" Intel Core Ultra 5 - LCD - WiFi',
  'Professional-grade performance with Intel Core Ultra processor and AI capabilities.',
  39.00,
  119.00,
  175.00,
  '{"processor": "Intel Core Ultra 5", "ram": "16GB", "storage": "256GB SSD", "display": "13\" PixelSense LCD", "battery": "Up to 15 hours"}'::jsonb,
  '13',
  'Enterprise-ready with Intel vPro and Windows 11 Pro',
  ARRAY['Surface Pro 10', 'Power adapter', 'Quick start guide'],
  NULL,
  false,
  true,
  false,
  2
FROM product_categories WHERE slug = 'surface-pro';

-- =====================================================
-- 3. Product Templates - Surface Laptop
-- =====================================================
INSERT INTO product_templates (
  category_id, name, subtitle, description, weekly_rate, monthly_rate, deposit_amount,
  specs, screen_size, highlights, includes, image_url, is_popular, has_accessories, is_new, display_order
)
SELECT
  id,
  'Surface Laptop 7',
  '13.8" Snapdragon X Elite - OLED - WiFi',
  'Ultra-thin laptop with stunning OLED display and Snapdragon X Elite performance.',
  59.00,
  179.00,
  250.00,
  '{"processor": "Snapdragon X Elite", "ram": "16GB", "storage": "512GB SSD", "display": "13.8\" OLED PixelSense", "battery": "Up to 18 hours"}'::jsonb,
  '13.8',
  'Stunning OLED display with HDR support for creative professionals',
  ARRAY['Surface Laptop 7', 'Power adapter', 'Quick start guide'],
  NULL,
  true,
  false,
  true,
  1
FROM product_categories WHERE slug = 'surface-laptop';

INSERT INTO product_templates (
  category_id, name, subtitle, description, weekly_rate, monthly_rate, deposit_amount,
  specs, screen_size, highlights, includes, image_url, is_popular, has_accessories, is_new, display_order
)
SELECT
  id,
  'Surface Laptop 6',
  '15" Intel Core Ultra 7 - LCD - WiFi',
  'Larger screen laptop for productivity with Intel Core Ultra performance.',
  49.00,
  149.00,
  225.00,
  '{"processor": "Intel Core Ultra 7", "ram": "32GB", "storage": "512GB SSD", "display": "15\" PixelSense LCD", "battery": "Up to 17 hours"}'::jsonb,
  '15',
  'Larger display ideal for multitasking and content creation',
  ARRAY['Surface Laptop 6', 'Power adapter', 'Quick start guide'],
  NULL,
  false,
  false,
  false,
  2
FROM product_categories WHERE slug = 'surface-laptop';

-- =====================================================
-- 4. Product Templates - Xbox
-- =====================================================
INSERT INTO product_templates (
  category_id, name, subtitle, description, weekly_rate, monthly_rate, deposit_amount,
  specs, screen_size, highlights, includes, image_url, is_popular, has_accessories, is_new, display_order
)
SELECT
  id,
  'Xbox Series X',
  '1TB - Black',
  'The fastest, most powerful Xbox ever. Experience 4K gaming at up to 120 fps.',
  29.00,
  89.00,
  150.00,
  '{"storage": "1TB SSD", "resolution": "Up to 8K HDR", "fps": "Up to 120 fps", "ray_tracing": "Hardware accelerated"}'::jsonb,
  NULL,
  'True 4K gaming with DirectStorage and Quick Resume',
  ARRAY['Xbox Series X Console', 'Wireless Controller', 'HDMI cable', 'Power cable'],
  NULL,
  true,
  true,
  false,
  1
FROM product_categories WHERE slug = 'xbox';

INSERT INTO product_templates (
  category_id, name, subtitle, description, weekly_rate, monthly_rate, deposit_amount,
  specs, screen_size, highlights, includes, image_url, is_popular, has_accessories, is_new, display_order
)
SELECT
  id,
  'Xbox Series S',
  '512GB - White',
  'Next-gen performance in the smallest Xbox ever. 1440p gaming for less.',
  19.00,
  59.00,
  100.00,
  '{"storage": "512GB SSD", "resolution": "Up to 1440p", "fps": "Up to 120 fps", "form_factor": "60% smaller than Series X"}'::jsonb,
  NULL,
  'Compact and affordable next-gen gaming',
  ARRAY['Xbox Series S Console', 'Wireless Controller', 'HDMI cable', 'Power cable'],
  NULL,
  false,
  true,
  false,
  2
FROM product_categories WHERE slug = 'xbox';

-- =====================================================
-- 5. Product Colors - Surface Pro 11
-- =====================================================
INSERT INTO product_colors (product_template_id, color_name, hex_code, text_color, border_color, display_order)
SELECT id, 'Platinum', '#E0E0E0', '#333333', '#CCCCCC', 1
FROM product_templates WHERE name = 'Surface Pro 11';

INSERT INTO product_colors (product_template_id, color_name, hex_code, text_color, border_color, display_order)
SELECT id, 'Black', '#1A1A1A', '#FFFFFF', '#333333', 2
FROM product_templates WHERE name = 'Surface Pro 11';

INSERT INTO product_colors (product_template_id, color_name, hex_code, text_color, border_color, display_order)
SELECT id, 'Sapphire', '#0F4C81', '#FFFFFF', '#1E5A8A', 3
FROM product_templates WHERE name = 'Surface Pro 11';

-- =====================================================
-- 6. Product Colors - Surface Pro 10
-- =====================================================
INSERT INTO product_colors (product_template_id, color_name, hex_code, text_color, border_color, display_order)
SELECT id, 'Platinum', '#E0E0E0', '#333333', '#CCCCCC', 1
FROM product_templates WHERE name = 'Surface Pro 10';

INSERT INTO product_colors (product_template_id, color_name, hex_code, text_color, border_color, display_order)
SELECT id, 'Black', '#1A1A1A', '#FFFFFF', '#333333', 2
FROM product_templates WHERE name = 'Surface Pro 10';

-- =====================================================
-- 7. Product Colors - Surface Laptop 7
-- =====================================================
INSERT INTO product_colors (product_template_id, color_name, hex_code, text_color, border_color, display_order)
SELECT id, 'Platinum', '#E0E0E0', '#333333', '#CCCCCC', 1
FROM product_templates WHERE name = 'Surface Laptop 7';

INSERT INTO product_colors (product_template_id, color_name, hex_code, text_color, border_color, display_order)
SELECT id, 'Black', '#1A1A1A', '#FFFFFF', '#333333', 2
FROM product_templates WHERE name = 'Surface Laptop 7';

INSERT INTO product_colors (product_template_id, color_name, hex_code, text_color, border_color, display_order)
SELECT id, 'Dune', '#B8A68E', '#333333', '#A08E76', 3
FROM product_templates WHERE name = 'Surface Laptop 7';

INSERT INTO product_colors (product_template_id, color_name, hex_code, text_color, border_color, display_order)
SELECT id, 'Sapphire', '#0F4C81', '#FFFFFF', '#1E5A8A', 4
FROM product_templates WHERE name = 'Surface Laptop 7';

-- =====================================================
-- 8. Accessories
-- =====================================================
INSERT INTO accessories (name, description, weekly_rate, monthly_rate, deposit_amount, display_order) VALUES
('Surface Pro Signature Keyboard', 'Alcantara keyboard with trackpad for Surface Pro', 10.00, 29.00, 50.00, 1),
('Surface Slim Pen 2', 'Precision stylus with haptic feedback', 5.00, 15.00, 30.00, 2),
('Surface Arc Mouse', 'Slim, lightweight Bluetooth mouse', 3.00, 9.00, 20.00, 3),
('Xbox Wireless Controller', 'Additional wireless controller for Xbox', 5.00, 15.00, 25.00, 4),
('Xbox Game Pass Ultimate', '1-month subscription included', 5.00, 15.00, 0.00, 5);

-- =====================================================
-- 9. Accessory Colors - Surface Pro Signature Keyboard
-- =====================================================
INSERT INTO accessory_colors (accessory_id, color_name, hex_code, text_color, border_color, display_order)
SELECT id, 'Black', '#1A1A1A', '#FFFFFF', '#333333', 1
FROM accessories WHERE name = 'Surface Pro Signature Keyboard';

INSERT INTO accessory_colors (accessory_id, color_name, hex_code, text_color, border_color, display_order)
SELECT id, 'Platinum', '#E0E0E0', '#333333', '#CCCCCC', 2
FROM accessories WHERE name = 'Surface Pro Signature Keyboard';

INSERT INTO accessory_colors (accessory_id, color_name, hex_code, text_color, border_color, display_order)
SELECT id, 'Sapphire', '#0F4C81', '#FFFFFF', '#1E5A8A', 3
FROM accessories WHERE name = 'Surface Pro Signature Keyboard';

-- =====================================================
-- 10. Accessory Colors - Xbox Wireless Controller
-- =====================================================
INSERT INTO accessory_colors (accessory_id, color_name, hex_code, text_color, border_color, display_order)
SELECT id, 'Carbon Black', '#1A1A1A', '#FFFFFF', '#333333', 1
FROM accessories WHERE name = 'Xbox Wireless Controller';

INSERT INTO accessory_colors (accessory_id, color_name, hex_code, text_color, border_color, display_order)
SELECT id, 'Robot White', '#FFFFFF', '#333333', '#E0E0E0', 2
FROM accessories WHERE name = 'Xbox Wireless Controller';

INSERT INTO accessory_colors (accessory_id, color_name, hex_code, text_color, border_color, display_order)
SELECT id, 'Shock Blue', '#0078D4', '#FFFFFF', '#0066B8', 3
FROM accessories WHERE name = 'Xbox Wireless Controller';

-- =====================================================
-- 11. Product-Accessory Links
-- =====================================================
-- Link keyboard and pen to Surface Pro category
INSERT INTO product_accessory_links (category_id, accessory_id, screen_size_filter)
SELECT c.id, a.id, NULL
FROM product_categories c, accessories a
WHERE c.slug = 'surface-pro' AND a.name = 'Surface Pro Signature Keyboard';

INSERT INTO product_accessory_links (category_id, accessory_id, screen_size_filter)
SELECT c.id, a.id, NULL
FROM product_categories c, accessories a
WHERE c.slug = 'surface-pro' AND a.name = 'Surface Slim Pen 2';

INSERT INTO product_accessory_links (category_id, accessory_id, screen_size_filter)
SELECT c.id, a.id, NULL
FROM product_categories c, accessories a
WHERE c.slug = 'surface-pro' AND a.name = 'Surface Arc Mouse';

-- Link mouse to Surface Laptop category
INSERT INTO product_accessory_links (category_id, accessory_id, screen_size_filter)
SELECT c.id, a.id, NULL
FROM product_categories c, accessories a
WHERE c.slug = 'surface-laptop' AND a.name = 'Surface Arc Mouse';

-- Link controller and Game Pass to Xbox category
INSERT INTO product_accessory_links (category_id, accessory_id, screen_size_filter)
SELECT c.id, a.id, NULL
FROM product_categories c, accessories a
WHERE c.slug = 'xbox' AND a.name = 'Xbox Wireless Controller';

INSERT INTO product_accessory_links (category_id, accessory_id, screen_size_filter)
SELECT c.id, a.id, NULL
FROM product_categories c, accessories a
WHERE c.slug = 'xbox' AND a.name = 'Xbox Game Pass Ultimate';
