-- Add social media fields to barbers table
ALTER TABLE barbers 
ADD COLUMN IF NOT EXISTS instagram TEXT,
ADD COLUMN IF NOT EXISTS twitter TEXT,
ADD COLUMN IF NOT EXISTS tiktok TEXT,
ADD COLUMN IF NOT EXISTS facebook TEXT;

-- Create indexes for social media fields in barbers table
CREATE INDEX IF NOT EXISTS idx_barbers_instagram ON barbers(instagram);
CREATE INDEX IF NOT EXISTS idx_barbers_twitter ON barbers(twitter);
CREATE INDEX IF NOT EXISTS idx_barbers_tiktok ON barbers(tiktok);
CREATE INDEX IF NOT EXISTS idx_barbers_facebook ON barbers(facebook);

-- Add comments to explain the new fields
COMMENT ON COLUMN barbers.instagram IS 'Instagram profile URL';
COMMENT ON COLUMN barbers.twitter IS 'Twitter/X profile URL';
COMMENT ON COLUMN barbers.tiktok IS 'TikTok profile URL';
COMMENT ON COLUMN barbers.facebook IS 'Facebook profile URL'; 