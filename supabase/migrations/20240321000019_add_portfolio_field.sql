-- Add portfolio field to barbers table
ALTER TABLE barbers 
ADD COLUMN IF NOT EXISTS portfolio TEXT[] DEFAULT '{}';

-- Add social media fields if they don't exist
ALTER TABLE barbers 
ADD COLUMN IF NOT EXISTS instagram TEXT,
ADD COLUMN IF NOT EXISTS twitter TEXT,
ADD COLUMN IF NOT EXISTS facebook TEXT,
ADD COLUMN IF NOT EXISTS tiktok TEXT; 