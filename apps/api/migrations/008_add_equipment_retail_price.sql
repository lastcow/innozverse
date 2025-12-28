-- Migration: Add retail_price to equipment table
-- Description: Add retail price field to track equipment value
-- Created: 2025-12-28

-- Add retail_price column
ALTER TABLE equipment
ADD COLUMN IF NOT EXISTS retail_price DECIMAL(10, 2);

-- Add comment for documentation
COMMENT ON COLUMN equipment.retail_price IS 'Retail price of the equipment in USD';
