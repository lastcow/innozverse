-- Migration: 011_create_inventory_items_table.sql
-- Description: Create inventory items table for tracking physical equipment units
-- Date: 2026-01-03

-- =====================================================
-- Inventory Items (Physical Equipment Units)
-- =====================================================
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to product template OR accessory (not both)
  product_template_id UUID REFERENCES product_templates(id) ON DELETE SET NULL,
  accessory_id UUID REFERENCES accessories(id) ON DELETE SET NULL,

  -- Physical item details
  serial_number VARCHAR(100) UNIQUE,
  color VARCHAR(100),                  -- Actual color of this unit

  -- Status (reusing existing equipment_status enum)
  status equipment_status NOT NULL DEFAULT 'available',
  condition equipment_condition NOT NULL DEFAULT 'excellent',

  -- Acquisition info
  purchase_date DATE,
  purchase_price DECIMAL(10,2),
  retail_price DECIMAL(10,2),

  -- Admin notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Either product_template_id OR accessory_id (or neither for legacy), not both
  CONSTRAINT valid_inventory_item CHECK (
    NOT (product_template_id IS NOT NULL AND accessory_id IS NOT NULL)
  )
);

-- Indexes for efficient querying
CREATE INDEX idx_inventory_items_product ON inventory_items(product_template_id);
CREATE INDEX idx_inventory_items_accessory ON inventory_items(accessory_id);
CREATE INDEX idx_inventory_items_status ON inventory_items(status);
CREATE INDEX idx_inventory_items_color ON inventory_items(color);
CREATE INDEX idx_inventory_items_available ON inventory_items(product_template_id, status, color)
  WHERE status = 'available';
CREATE INDEX idx_inventory_items_serial ON inventory_items(serial_number);

-- Trigger for updated_at
CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE inventory_items IS 'Physical inventory units linked to product templates or accessories';
COMMENT ON COLUMN inventory_items.product_template_id IS 'Link to product template (for main products)';
COMMENT ON COLUMN inventory_items.accessory_id IS 'Link to accessory (for add-on items)';
COMMENT ON COLUMN inventory_items.color IS 'Actual color of this specific unit';
