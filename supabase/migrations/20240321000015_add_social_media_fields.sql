-- Add social media fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS tiktok_url TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT;

-- Add service description field
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Create indexes for social media fields
CREATE INDEX IF NOT EXISTS idx_profiles_instagram ON profiles(instagram_url);
CREATE INDEX IF NOT EXISTS idx_profiles_twitter ON profiles(twitter_url);
CREATE INDEX IF NOT EXISTS idx_profiles_tiktok ON profiles(tiktok_url);
CREATE INDEX IF NOT EXISTS idx_profiles_facebook ON profiles(facebook_url);

-- Add comments to explain the new fields
COMMENT ON COLUMN profiles.instagram_url IS 'Instagram profile URL';
COMMENT ON COLUMN profiles.twitter_url IS 'Twitter/X profile URL';
COMMENT ON COLUMN profiles.tiktok_url IS 'TikTok profile URL';
COMMENT ON COLUMN profiles.facebook_url IS 'Facebook profile URL';
COMMENT ON COLUMN services.description IS 'Detailed description of the service'; 