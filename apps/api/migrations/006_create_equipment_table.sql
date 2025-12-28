-- Migration: Create equipment table
-- Description: Equipment catalog for rental system with categories for computers, gaming, and peripherals
-- Created: 2025-12-28

-- Create equipment category enum
DO $$ BEGIN
  CREATE TYPE equipment_category AS ENUM (
    'laptop',
    'desktop',
    'monitor',
    'keyboard',
    'mouse',
    'headset',
    'gaming_console',
    'controller',
    'peripheral'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create equipment status enum
DO $$ BEGIN
  CREATE TYPE equipment_status AS ENUM (
    'available',
    'rented',
    'maintenance',
    'retired'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create equipment condition enum
DO $$ BEGIN
  CREATE TYPE equipment_condition AS ENUM (
    'excellent',
    'good',
    'fair'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create equipment table
CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category equipment_category NOT NULL,
  brand VARCHAR(100),
  model VARCHAR(100),
  serial_number VARCHAR(100) UNIQUE,
  daily_rate DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  specs JSONB,
  status equipment_status NOT NULL DEFAULT 'available',
  condition equipment_condition NOT NULL DEFAULT 'excellent',
  purchase_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_name ON equipment(name);
CREATE INDEX IF NOT EXISTS idx_equipment_daily_rate ON equipment(daily_rate);
CREATE INDEX IF NOT EXISTS idx_equipment_brand ON equipment(brand);

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_equipment_updated_at ON equipment;
CREATE TRIGGER update_equipment_updated_at
  BEFORE UPDATE ON equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE equipment IS 'Equipment catalog for rental system';
COMMENT ON COLUMN equipment.specs IS 'Flexible JSON specs like RAM, storage, screen size, processor, etc.';
COMMENT ON COLUMN equipment.daily_rate IS 'Daily rental rate in USD';
