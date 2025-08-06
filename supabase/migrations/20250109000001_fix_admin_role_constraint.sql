-- Fix admin role constraint issue
-- Drop the existing constraint and recreate it to ensure 'admin' is properly included

-- First, drop the existing constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Recreate the constraint with proper values
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('client', 'barber', 'admin'));

-- Verify the constraint is working by checking current roles
-- This will help identify any existing data issues
SELECT DISTINCT role FROM profiles ORDER BY role; 