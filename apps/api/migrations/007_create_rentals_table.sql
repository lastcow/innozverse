-- Migration: Create rentals table
-- Description: Track equipment rentals by users with status workflow
-- Created: 2025-12-28

-- Create rental status enum
DO $$ BEGIN
  CREATE TYPE rental_status AS ENUM (
    'pending',
    'confirmed',
    'active',
    'completed',
    'cancelled',
    'overdue'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create rentals table
CREATE TABLE IF NOT EXISTS rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  daily_rate DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status rental_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  pickup_date TIMESTAMP WITH TIME ZONE,
  return_date TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancelled_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_rental_dates CHECK (end_date >= start_date)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_rentals_user_id ON rentals(user_id);
CREATE INDEX IF NOT EXISTS idx_rentals_equipment_id ON rentals(equipment_id);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status);
CREATE INDEX IF NOT EXISTS idx_rentals_start_date ON rentals(start_date);
CREATE INDEX IF NOT EXISTS idx_rentals_end_date ON rentals(end_date);

-- Composite index for finding active rentals for specific equipment
CREATE INDEX IF NOT EXISTS idx_rentals_equipment_active ON rentals(equipment_id, start_date, end_date)
  WHERE status IN ('pending', 'confirmed', 'active');

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_rentals_updated_at ON rentals;
CREATE TRIGGER update_rentals_updated_at
  BEFORE UPDATE ON rentals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE rentals IS 'Equipment rental records tracking user rentals';
COMMENT ON COLUMN rentals.daily_rate IS 'Snapshot of equipment daily rate at time of rental creation';
COMMENT ON COLUMN rentals.total_amount IS 'Calculated total: daily_rate * number of days';
COMMENT ON COLUMN rentals.status IS 'Rental workflow: pending -> confirmed -> active -> completed (or cancelled at any point)';
