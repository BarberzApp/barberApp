-- Drop all existing booking policies
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;

-- Recreate booking policies with correct permissions
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

CREATE POLICY "Users can create bookings"
    ON bookings FOR INSERT
    WITH CHECK (
        auth.uid() = client_id 
        OR client_id IS NULL
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