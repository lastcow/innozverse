-- Migration: 012_enhance_rentals_table.sql
-- Description: Enhance rentals table for product-based rentals with accessories
-- Date: 2026-01-03

-- =====================================================
-- Create pricing_period enum
-- =====================================================
CREATE TYPE pricing_period AS ENUM ('weekly', 'monthly');

-- =====================================================
-- Create deposit_status enum
-- =====================================================
CREATE TYPE deposit_status AS ENUM ('held', 'released', 'forfeited', 'partial_refund');

-- =====================================================
-- Alter Rentals Table
-- =====================================================

-- Add product template reference
ALTER TABLE rentals ADD COLUMN product_template_id UUID REFERENCES product_templates(id) ON DELETE SET NULL;

-- Add inventory item reference (for auto-assigned physical unit)
ALTER TABLE rentals ADD COLUMN inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL;

-- Add color selection
ALTER TABLE rentals ADD COLUMN selected_color VARCHAR(100);

-- Add pricing period
ALTER TABLE rentals ADD COLUMN pricing_period pricing_period;

-- Add pricing snapshot (captured at rental time)
ALTER TABLE rentals ADD COLUMN weekly_rate DECIMAL(10,2);
ALTER TABLE rentals ADD COLUMN monthly_rate DECIMAL(10,2);
ALTER TABLE rentals ADD COLUMN deposit_amount DECIMAL(10,2);

-- Add deposit tracking
ALTER TABLE rentals ADD COLUMN deposit_status deposit_status DEFAULT 'held';
ALTER TABLE rentals ADD COLUMN deposit_released_at TIMESTAMPTZ;
ALTER TABLE rentals ADD COLUMN deposit_notes TEXT;

-- Add discount/fee tracking
ALTER TABLE rentals ADD COLUMN student_discount_applied BOOLEAN DEFAULT false;
ALTER TABLE rentals ADD COLUMN new_equipment_fee_applied BOOLEAN DEFAULT false;
ALTER TABLE rentals ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE rentals ADD COLUMN fee_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE rentals ADD COLUMN final_total DECIMAL(10,2);

-- Make equipment_id nullable (for product-template-based rentals)
ALTER TABLE rentals ALTER COLUMN equipment_id DROP NOT NULL;

-- Add constraint: must have either equipment_id OR product_template_id
ALTER TABLE rentals ADD CONSTRAINT valid_rental_reference CHECK (
  equipment_id IS NOT NULL OR product_template_id IS NOT NULL
);

-- Indexes
CREATE INDEX idx_rentals_product_template ON rentals(product_template_id);
CREATE INDEX idx_rentals_inventory_item ON rentals(inventory_item_id);
CREATE INDEX idx_rentals_deposit_status ON rentals(deposit_status);

-- =====================================================
-- Rental Accessories Junction Table
-- =====================================================
CREATE TABLE rental_accessories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  accessory_id UUID NOT NULL REFERENCES accessories(id) ON DELETE RESTRICT,

  -- Assigned inventory item (physical unit)
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,

  -- Selected color for this accessory
  selected_color VARCHAR(100),

  -- Pricing snapshot at time of rental
  weekly_rate DECIMAL(10,2) NOT NULL,
  monthly_rate DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2) NOT NULL,

  -- Deposit tracking
  deposit_status deposit_status DEFAULT 'held',

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate accessories on same rental
  UNIQUE(rental_id, accessory_id)
);

-- Indexes
CREATE INDEX idx_rental_accessories_rental ON rental_accessories(rental_id);
CREATE INDEX idx_rental_accessories_accessory ON rental_accessories(accessory_id);
CREATE INDEX idx_rental_accessories_inventory ON rental_accessories(inventory_item_id);

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON COLUMN rentals.product_template_id IS 'Reference to product template for catalog-based rentals';
COMMENT ON COLUMN rentals.inventory_item_id IS 'Auto-assigned physical inventory unit';
COMMENT ON COLUMN rentals.selected_color IS 'Customer-selected color for the rental';
COMMENT ON COLUMN rentals.pricing_period IS 'Whether pricing is weekly or monthly';
COMMENT ON COLUMN rentals.deposit_status IS 'Current status of the security deposit';
COMMENT ON COLUMN rentals.student_discount_applied IS 'Whether 15% student discount was applied';
COMMENT ON COLUMN rentals.new_equipment_fee_applied IS 'Whether 5% new equipment fee was applied';
COMMENT ON COLUMN rentals.final_total IS 'Final calculated total after discounts/fees';

COMMENT ON TABLE rental_accessories IS 'Junction table linking rentals to their selected accessories';
