-- Add coverPhoto field to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS coverPhoto TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_cover_photo ON profiles(coverPhoto);

-- Add comment for documentation
COMMENT ON COLUMN profiles.coverPhoto IS 'URL to the user''s cover photo image'; 