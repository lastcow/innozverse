-- Add invite token fields to users table
ALTER TABLE users
ADD COLUMN invite_token VARCHAR(255),
ADD COLUMN invite_expires_at TIMESTAMP;

-- Create index for faster invite token lookups
CREATE INDEX idx_users_invite_token ON users(invite_token);
