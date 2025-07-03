-- Set public profile default to true for new profiles
ALTER TABLE profiles ALTER COLUMN is_public SET DEFAULT true;

-- Update existing profiles to be public if they're not set
UPDATE profiles SET is_public = true WHERE is_public IS NULL OR is_public = false; 