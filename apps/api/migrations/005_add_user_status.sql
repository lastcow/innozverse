-- Migration: Add user status field
-- Description: Replace is_active boolean with status enum for better user state management
-- Created: 2025-12-22

-- Create user status type
CREATE TYPE user_status AS ENUM ('invited', 'active', 'suspended', 'deleted');

-- Add status column with default value
ALTER TABLE users
ADD COLUMN status user_status NOT NULL DEFAULT 'active';

-- Migrate existing data: convert is_active to status
UPDATE users
SET status = CASE
  WHEN is_active = true THEN 'active'::user_status
  WHEN is_active = false THEN 'suspended'::user_status
END;

-- Update users with pending invitations to 'invited' status
UPDATE users
SET status = 'invited'::user_status
WHERE invite_token IS NOT NULL AND invite_expires_at > NOW();

-- Create index on status for filtering
CREATE INDEX idx_users_status ON users(status);

-- Note: We keep is_active for backward compatibility, but status is the source of truth
-- You may remove is_active column once you've verified the migration works correctly
