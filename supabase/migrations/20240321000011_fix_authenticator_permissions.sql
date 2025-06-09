-- Grant necessary permissions to the authenticator role
GRANT USAGE ON SCHEMA public TO authenticator;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticator;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticator;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticator;

-- Ensure the authenticator role can bypass RLS
ALTER TABLE bookings FORCE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Drop and recreate the insert policy to be more permissive
DROP POLICY IF EXISTS "Anyone can create bookings" ON bookings;
CREATE POLICY "Anyone can create bookings"
    ON bookings FOR INSERT
    WITH CHECK (true);

-- Ensure the policy is applied to the authenticator role
ALTER POLICY "Anyone can create bookings" ON bookings TO authenticator; 