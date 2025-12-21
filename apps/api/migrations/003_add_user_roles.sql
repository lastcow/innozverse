-- Migration: Add user roles and ACL support
-- Description: Converts existing VARCHAR role column to ENUM with predefined role types

-- Create enum type for user roles (if it doesn't exist)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'admin',
    'super_user',
    'guest',
    'subscription_1',
    'subscription_2',
    'subscription_3',
    'subscription_4',
    'subscription_5',
    'freebie'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Update existing users with 'user' role to 'guest' (mapping old role to new)
UPDATE users SET role = 'guest' WHERE role = 'user';

-- Drop the existing default before changing the column type
ALTER TABLE users
ALTER COLUMN role DROP DEFAULT;

-- Alter the existing role column to use the ENUM type
-- Note: This assumes the role column already exists as VARCHAR from migration 001
ALTER TABLE users
ALTER COLUMN role TYPE user_role USING role::text::user_role;

-- Set the new default value to 'guest'
ALTER TABLE users
ALTER COLUMN role SET DEFAULT 'guest'::user_role;

-- Index already exists from migration 001, so we don't need to create it again

-- Add comment to document role meanings
COMMENT ON COLUMN users.role IS 'User role for access control: admin (full access), super_user (elevated access), guest (limited access), subscription_1-5 (paid tiers), freebie (free tier)';
