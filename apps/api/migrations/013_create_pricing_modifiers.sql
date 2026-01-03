-- Migration: 013_create_pricing_modifiers.sql
-- Description: Create pricing modifiers table and add student status to users
-- Date: 2026-01-03

-- =====================================================
-- Create modifier_type enum
-- =====================================================
CREATE TYPE modifier_type AS ENUM ('discount', 'fee');

-- =====================================================
-- Pricing Modifiers Table
-- =====================================================
CREATE TABLE pricing_modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,   -- 'student_discount', 'new_equipment_fee'
  display_name VARCHAR(255) NOT NULL,  -- 'Student Discount', 'New Equipment Fee'
  type modifier_type NOT NULL,         -- 'discount' or 'fee'
  percentage DECIMAL(5,2) NOT NULL,    -- 15.00 for 15%, 5.00 for 5%

  -- What does this apply to?
  applies_to VARCHAR(50) NOT NULL DEFAULT 'rental_only',  -- 'all', 'rental_only', 'deposit_only'

  -- Does it require verification?
  requires_verification BOOLEAN DEFAULT false,

  -- Admin control
  is_active BOOLEAN DEFAULT true,
  description TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default pricing modifiers
INSERT INTO pricing_modifiers (name, display_name, type, percentage, applies_to, requires_verification, description) VALUES
  ('student_discount', 'Student Discount', 'discount', 15.00, 'all', true, '15% discount for verified students on all rental prices'),
  ('new_equipment_fee', 'New Equipment Fee', 'fee', 5.00, 'rental_only', false, '5% additional fee for brand new equipment');

-- Trigger for updated_at
CREATE TRIGGER update_pricing_modifiers_updated_at
  BEFORE UPDATE ON pricing_modifiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Add Student Status to Users
-- =====================================================
ALTER TABLE users ADD COLUMN is_student BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN student_verified_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN student_email VARCHAR(255);          -- .edu email for verification
ALTER TABLE users ADD COLUMN student_institution VARCHAR(255);   -- School/university name

-- Index for student queries
CREATE INDEX idx_users_student ON users(is_student) WHERE is_student = true;

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON TABLE pricing_modifiers IS 'Configurable discounts and fees for rental pricing';
COMMENT ON COLUMN pricing_modifiers.applies_to IS 'What the modifier applies to: all (rental+deposit), rental_only, or deposit_only';
COMMENT ON COLUMN pricing_modifiers.requires_verification IS 'Whether user needs verification to receive this modifier (e.g., student status)';

COMMENT ON COLUMN users.is_student IS 'Whether user is verified as a student for discount eligibility';
COMMENT ON COLUMN users.student_verified_at IS 'When student status was verified';
COMMENT ON COLUMN users.student_email IS 'Student email (.edu) used for verification';
COMMENT ON COLUMN users.student_institution IS 'Name of the educational institution';
