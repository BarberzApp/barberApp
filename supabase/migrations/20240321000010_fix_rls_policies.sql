-- First, ensure RLS is enabled on the bookings table
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
DROP POLICY IF EXISTS "Anyone can create bookings" ON bookings;

-- Create a policy that allows anyone to create bookings
CREATE POLICY "Anyone can create bookings"
    ON bookings FOR INSERT
    WITH CHECK (true);

-- Create a policy that allows users to view their own bookings
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

-- Create a policy that allows users to update their own bookings
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

-- Grant necessary permissions
GRANT ALL ON bookings TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated; 