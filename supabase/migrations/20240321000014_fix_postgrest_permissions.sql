-- First, ensure RLS is enabled
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
DROP POLICY IF EXISTS "Anyone can create bookings" ON bookings;
DROP POLICY IF EXISTS "Enable insert for all users" ON bookings;

-- Grant necessary permissions to authenticator role
GRANT USAGE ON SCHEMA public TO authenticator;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticator;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticator;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticator;

-- Create a policy that allows the authenticator role to bypass RLS
CREATE POLICY "Enable all for authenticator"
    ON bookings
    FOR ALL
    TO authenticator
    USING (true)
    WITH CHECK (true);

-- Create policies for other roles
CREATE POLICY "Enable insert for authenticated users"
    ON bookings FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can view own bookings"
    ON bookings FOR SELECT
    TO authenticated
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
    TO authenticated
    USING (
        auth.uid() = client_id 
        OR EXISTS (
            SELECT 1 FROM barbers
            WHERE barbers.id = bookings.barber_id
            AND barbers.user_id = auth.uid()
        )
    );

-- Create policies for anonymous users
CREATE POLICY "Enable insert for anonymous users"
    ON bookings FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Enable select for anonymous users"
    ON bookings FOR SELECT
    TO anon
    USING (true); 