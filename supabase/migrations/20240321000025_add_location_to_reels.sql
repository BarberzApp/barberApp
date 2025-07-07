-- Add location fields to reels table for location-based filtering
ALTER TABLE reels 
ADD COLUMN IF NOT EXISTS location_name TEXT,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'US';

-- Add index for location-based queries
CREATE INDEX IF NOT EXISTS idx_reels_location ON reels(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_reels_city ON reels(city);
CREATE INDEX IF NOT EXISTS idx_reels_state ON reels(state);

-- Add comments for documentation
COMMENT ON COLUMN reels.location_name IS 'Human-readable location name (e.g., "Downtown Barber Shop")';
COMMENT ON COLUMN reels.latitude IS 'Latitude coordinate for location-based filtering';
COMMENT ON COLUMN reels.longitude IS 'Longitude coordinate for location-based filtering';
COMMENT ON COLUMN reels.city IS 'City name for location filtering';
COMMENT ON COLUMN reels.state IS 'State/province for location filtering';
COMMENT ON COLUMN reels.country IS 'Country code for location filtering'; 