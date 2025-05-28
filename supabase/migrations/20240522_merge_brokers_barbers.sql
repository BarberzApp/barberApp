-- First, add any missing columns from brokers to barbers
ALTER TABLE barbers
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS open_to_hire BOOLEAN DEFAULT false;

-- Migrate data from brokers to barbers
INSERT INTO barbers (
    id,
    name,
    email,
    bio,
    specialties,
    portfolio,
    price_range,
    rating,
    total_reviews,
    business_id,
    open_to_hire,
    created_at,
    updated_at
)
SELECT 
    b.id,
    u.name,
    u.email,
    b.bio,
    ARRAY[b.specialties],
    ARRAY[b.portfolio],
    b.price_range,
    b.rating,
    b.total_reviews,
    b.business_id,
    b.open_to_hire,
    b.created_at,
    b.updated_at
FROM brokers b
JOIN users u ON b.user_id = u.id
ON CONFLICT (id) DO UPDATE
SET 
    bio = EXCLUDED.bio,
    specialties = EXCLUDED.specialties,
    portfolio = EXCLUDED.portfolio,
    price_range = EXCLUDED.price_range,
    rating = EXCLUDED.rating,
    total_reviews = EXCLUDED.total_reviews,
    business_id = EXCLUDED.business_id,
    open_to_hire = EXCLUDED.open_to_hire,
    updated_at = NOW();

-- Drop foreign key constraints first
ALTER TABLE bookings
    DROP CONSTRAINT IF EXISTS fk_bookings_broker;

ALTER TABLE reviews
    DROP CONSTRAINT IF EXISTS fk_reviews_broker;

ALTER TABLE time_off
    DROP CONSTRAINT IF EXISTS fk_time_off_broker;

-- Update foreign key references in other tables
ALTER TABLE bookings
    RENAME COLUMN broker_id TO barber_id;

ALTER TABLE reviews
    RENAME COLUMN broker_id TO barber_id;

ALTER TABLE time_off
    RENAME COLUMN broker_id TO barber_id;

-- Add new foreign key constraints
ALTER TABLE bookings
    ADD CONSTRAINT fk_bookings_barber
    FOREIGN KEY (barber_id)
    REFERENCES barbers(id)
    ON DELETE CASCADE;

ALTER TABLE reviews
    ADD CONSTRAINT fk_reviews_barber
    FOREIGN KEY (barber_id)
    REFERENCES barbers(id)
    ON DELETE CASCADE;

ALTER TABLE time_off
    ADD CONSTRAINT fk_time_off_barber
    FOREIGN KEY (barber_id)
    REFERENCES barbers(id)
    ON DELETE CASCADE;

-- Drop the brokers table
DROP TABLE IF EXISTS brokers;

-- Update RLS policies for barbers
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view public barbers" ON barbers;
DROP POLICY IF EXISTS "Users can update their own barber profile" ON barbers;
DROP POLICY IF EXISTS "Users can insert their own barber profile" ON barbers;

-- Create policy for viewing public barbers
CREATE POLICY "Users can view public barbers"
ON barbers FOR SELECT
USING ("isPublic" = true);

-- Create policy for users to update their own barber profile
CREATE POLICY "Users can update their own barber profile"
ON barbers FOR UPDATE
USING (auth.uid() = user_id);

-- Create policy for users to insert their own barber profile
CREATE POLICY "Users can insert their own barber profile"
ON barbers FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT ON barbers TO authenticated;
GRANT UPDATE ON barbers TO authenticated;
GRANT INSERT ON barbers TO authenticated; 