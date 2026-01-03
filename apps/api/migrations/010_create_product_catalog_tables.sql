-- Migration: 010_create_product_catalog_tables.sql
-- Description: Create product catalog tables for enhanced equipment rental system
-- Date: 2026-01-03

-- =====================================================
-- 1. Product Categories
-- =====================================================
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),                    -- Icon identifier for UI (e.g., 'Tablet', 'Laptop', 'Gamepad2')
  color VARCHAR(20),                   -- UI theme color: 'cyan', 'green', 'orange'
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for ordering and filtering
CREATE INDEX idx_product_categories_active ON product_categories(is_active, display_order);
CREATE INDEX idx_product_categories_slug ON product_categories(slug);

-- =====================================================
-- 2. Product Templates (Variants)
-- =====================================================
CREATE TABLE product_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  subtitle VARCHAR(500),               -- e.g., '13" Snapdragon X Plus (10 Core) - LCD - WiFi'
  description TEXT,

  -- Tri-tier pricing
  weekly_rate DECIMAL(10,2) NOT NULL,
  monthly_rate DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2) NOT NULL,

  -- Specifications (flexible JSON)
  specs JSONB,                         -- {processor, ram, storage, screen_size, display_type}
  screen_size VARCHAR(10),             -- For accessory linking: '12', '13', '13.8'

  -- Marketing content
  highlights TEXT,                     -- Short value proposition
  includes TEXT[],                     -- Array of included items
  image_url TEXT,

  -- Flags
  is_popular BOOLEAN DEFAULT false,    -- Show "RECOMMENDED" badge
  has_accessories BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT false,        -- Apply +5% new equipment fee
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_product_templates_category ON product_templates(category_id);
CREATE INDEX idx_product_templates_active ON product_templates(is_active, display_order);
CREATE INDEX idx_product_templates_screen_size ON product_templates(screen_size);
CREATE INDEX idx_product_templates_popular ON product_templates(is_popular) WHERE is_popular = true;

-- =====================================================
-- 3. Product Colors
-- =====================================================
CREATE TABLE product_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_template_id UUID NOT NULL REFERENCES product_templates(id) ON DELETE CASCADE,
  color_name VARCHAR(100) NOT NULL,
  hex_code VARCHAR(7),                 -- e.g., '#1a1a1a'
  text_color VARCHAR(7),               -- Text color for contrast
  border_color VARCHAR(7),             -- Border color for badges
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_product_colors_template ON product_colors(product_template_id);
CREATE INDEX idx_product_colors_active ON product_colors(product_template_id, is_active);

-- =====================================================
-- 4. Accessories
-- =====================================================
CREATE TABLE accessories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Tri-tier pricing
  weekly_rate DECIMAL(10,2) NOT NULL,
  monthly_rate DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2) NOT NULL,

  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_accessories_active ON accessories(is_active, display_order);

-- =====================================================
-- 5. Accessory Colors
-- =====================================================
CREATE TABLE accessory_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accessory_id UUID NOT NULL REFERENCES accessories(id) ON DELETE CASCADE,
  color_name VARCHAR(100) NOT NULL,
  hex_code VARCHAR(7),
  text_color VARCHAR(7),
  border_color VARCHAR(7),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_accessory_colors_accessory ON accessory_colors(accessory_id);

-- =====================================================
-- 6. Product-Accessory Links
-- =====================================================
CREATE TABLE product_accessory_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_template_id UUID REFERENCES product_templates(id) ON DELETE CASCADE,
  category_id UUID REFERENCES product_categories(id) ON DELETE CASCADE,
  accessory_id UUID NOT NULL REFERENCES accessories(id) ON DELETE CASCADE,

  -- Optional screen size filter (for Surface Pro 12" vs 13" keyboards)
  screen_size_filter VARCHAR(10),

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Either product_template_id OR category_id must be set
  CONSTRAINT valid_link CHECK (product_template_id IS NOT NULL OR category_id IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_product_accessory_links_product ON product_accessory_links(product_template_id);
CREATE INDEX idx_product_accessory_links_category ON product_accessory_links(category_id);
CREATE INDEX idx_product_accessory_links_accessory ON product_accessory_links(accessory_id);
CREATE INDEX idx_product_accessory_links_screen ON product_accessory_links(screen_size_filter);

-- =====================================================
-- Trigger for updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_product_categories_updated_at
  BEFORE UPDATE ON product_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_templates_updated_at
  BEFORE UPDATE ON product_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accessories_updated_at
  BEFORE UPDATE ON accessories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON TABLE product_categories IS 'Top-level product groupings (Surface Pro, Surface Laptop, Xbox)';
COMMENT ON TABLE product_templates IS 'Product variants with pricing and specifications';
COMMENT ON TABLE product_colors IS 'Available color options per product template';
COMMENT ON TABLE accessories IS 'Add-on items that can be rented with products';
COMMENT ON TABLE accessory_colors IS 'Available color options per accessory';
COMMENT ON TABLE product_accessory_links IS 'Links accessories to products or categories with optional screen size filtering';
