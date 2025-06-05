-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Barbers can view own profile" ON barbers;
DROP POLICY IF EXISTS "Barbers can update own profile" ON barbers;
DROP POLICY IF EXISTS "Services are viewable by everyone" ON services;
DROP POLICY IF EXISTS "Barbers can manage own services" ON services;
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
DROP POLICY IF EXISTS "Availability is viewable by everyone" ON availability;
DROP POLICY IF EXISTS "Barbers can manage own availability" ON availability;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- Profiles policies
CREATE POLICY "Enable insert for authenticated users only"
    ON profiles FOR INSERT
    WITH CHECK ((SELECT auth.uid()) = id);

-- Barbers policies
CREATE POLICY "Barbers can view own profile"
    ON barbers FOR SELECT
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Barbers can update own profile"
    ON barbers FOR UPDATE
    USING ((SELECT auth.uid()) = user_id);

-- Services policies (consolidated)
CREATE POLICY "Services access policy"
    ON services FOR ALL
    USING (
        CASE 
            WHEN (SELECT auth.uid()) IS NULL THEN false
            WHEN EXISTS (
                SELECT 1 FROM barbers
                WHERE barbers.id = services.barber_id
                AND barbers.user_id = (SELECT auth.uid())
            ) THEN true
            ELSE true -- Allow viewing for everyone
        END
    );

-- Bookings policies
CREATE POLICY "Users can view own bookings"
    ON bookings FOR SELECT
    USING (
        (SELECT auth.uid()) = client_id 
        OR EXISTS (
            SELECT 1 FROM barbers
            WHERE barbers.id = bookings.barber_id
            AND barbers.user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Users can create bookings"
    ON bookings FOR INSERT
    WITH CHECK ((SELECT auth.uid()) = client_id);

CREATE POLICY "Users can update own bookings"
    ON bookings FOR UPDATE
    USING (
        (SELECT auth.uid()) = client_id 
        OR EXISTS (
            SELECT 1 FROM barbers
            WHERE barbers.id = bookings.barber_id
            AND barbers.user_id = (SELECT auth.uid())
        )
    );

-- Availability policies (consolidated)
CREATE POLICY "Availability access policy"
    ON availability FOR ALL
    USING (
        CASE 
            WHEN (SELECT auth.uid()) IS NULL THEN false
            WHEN EXISTS (
                SELECT 1 FROM barbers
                WHERE barbers.id = availability.barber_id
                AND barbers.user_id = (SELECT auth.uid())
            ) THEN true
            ELSE true -- Allow viewing for everyone
        END
    );

-- Notifications policies
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING ((SELECT auth.uid()) = user_id); 