-- Fix auth schema issues with confirmation_token NULL values
-- This addresses the "converting NULL to string is unsupported" error

-- First, check if there are any NULL confirmation_token values and fix them
UPDATE auth.users 
SET confirmation_token = ''
WHERE confirmation_token IS NULL;

-- Update the column to have a default value to prevent future NULLs
ALTER TABLE auth.users 
ALTER COLUMN confirmation_token SET DEFAULT '';

-- Also check and fix any other nullable string columns that might cause issues
UPDATE auth.users 
SET recovery_token = COALESCE(recovery_token, ''),
    email_change_token_new = COALESCE(email_change_token_new, ''),
    email_change_token_current = COALESCE(email_change_token_current, '');

-- Set defaults for these columns too
ALTER TABLE auth.users 
ALTER COLUMN recovery_token SET DEFAULT '',
ALTER COLUMN email_change_token_new SET DEFAULT '',
ALTER COLUMN email_change_token_current SET DEFAULT '';