-- Add location fields to barbers table
ALTER TABLE barbers 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT;

-- Add indexes for location-based queries
CREATE INDEX IF NOT EXISTS idx_barbers_location ON barbers(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_barbers_city ON barbers(city);
CREATE INDEX IF NOT EXISTS idx_barbers_state ON barbers(state);

-- Add comments for documentation
COMMENT ON COLUMN barbers.latitude IS 'Latitude coordinate for location-based filtering';
COMMENT ON COLUMN barbers.longitude IS 'Longitude coordinate for location-based filtering';
COMMENT ON COLUMN barbers.city IS 'City name for location filtering';
COMMENT ON COLUMN barbers.state IS 'State/province for location filtering';
