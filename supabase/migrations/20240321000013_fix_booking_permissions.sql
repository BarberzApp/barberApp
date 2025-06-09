-- First, ensure RLS is enabled
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
DROP POLICY IF EXISTS "Anyone can create bookings" ON bookings;
DROP POLICY IF EXISTS "Enable insert for all users" ON bookings;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, authenticator;
GRANT ALL ON bookings TO anon, authenticated, authenticator;

-- Create policies
CREATE POLICY "Enable insert for all users"
    ON bookings FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can view own bookings"
    ON bookings FOR SELECT
    USING (
        auth.uid() = client_id 
        OR EXISTS (
            SELECT 1 FROM barbers
            WHERE barbers.id = bookings.barber_id
            AND barbers.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own bookings"
    ON bookings FOR UPDATE
    USING (
        auth.uid() = client_id 
        OR EXISTS (
            SELECT 1 FROM barbers
            WHERE barbers.id = bookings.barber_id
            AND barbers.user_id = auth.uid()
        )
    );

-- Ensure the policies are applied to all roles
ALTER POLICY "Enable insert for all users" ON bookings TO anon, authenticated, authenticator;
ALTER POLICY "Users can view own bookings" ON bookings TO anon, authenticated, authenticator;
ALTER POLICY "Users can update own bookings" ON bookings TO anon, authenticated, authenticator; 