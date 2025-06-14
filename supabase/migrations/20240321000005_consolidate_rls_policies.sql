-- First disable RLS on all tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE barbers DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE availability DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE special_hours DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Barbers are viewable by everyone" ON barbers;
DROP POLICY IF EXISTS "Barbers can manage own profile" ON barbers;
DROP POLICY IF EXISTS "Services are viewable by everyone" ON services;
DROP POLICY IF EXISTS "Barbers can manage own services" ON services;
DROP POLICY IF EXISTS "Bookings are viewable by involved parties" ON bookings;
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
DROP POLICY IF EXISTS "Availability is viewable by everyone" ON availability;
DROP POLICY IF EXISTS "Barbers can manage own availability" ON availability;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Special hours are viewable by everyone" ON special_hours;
DROP POLICY IF EXISTS "Barbers can manage own special hours" ON special_hours;

-- Grant necessary permissions to roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, authenticator;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role, authenticator;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role, authenticator;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role, authenticator;

-- Now enable RLS and create new policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_hours ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Barbers policies
CREATE POLICY "Barbers are viewable by everyone"
    ON barbers FOR SELECT
    USING (true);

CREATE POLICY "Barbers can manage own profile"
    ON barbers FOR ALL
    USING (auth.uid() = user_id);

-- Services policies
CREATE POLICY "Services are viewable by everyone"
    ON services FOR SELECT
    USING (true);

CREATE POLICY "Barbers can manage own services"
    ON services FOR ALL
    USING (EXISTS (
        SELECT 1 FROM barbers
        WHERE barbers.id = services.barber_id
        AND barbers.user_id = auth.uid()
    ));

-- Bookings policies
CREATE POLICY "Bookings are viewable by involved parties"
    ON bookings FOR SELECT
    USING (
        auth.uid() = client_id 
        OR EXISTS (
            SELECT 1 FROM barbers
            WHERE barbers.id = bookings.barber_id
            AND barbers.user_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can create bookings"
    ON bookings FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = client_id
        OR (
            guest_name IS NOT NULL 
            AND guest_email IS NOT NULL 
            AND guest_phone IS NOT NULL
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

-- Availability policies
CREATE POLICY "Availability is viewable by everyone"
    ON availability FOR SELECT
    USING (true);

CREATE POLICY "Barbers can manage own availability"
    ON availability FOR ALL
    USING (EXISTS (
        SELECT 1 FROM barbers
        WHERE barbers.id = availability.barber_id
        AND barbers.user_id = auth.uid()
    ));

-- Notifications policies
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Special hours policies
CREATE POLICY "Special hours are viewable by everyone"
    ON special_hours FOR SELECT
    USING (true);

CREATE POLICY "Barbers can manage own special hours"
    ON special_hours FOR ALL
    USING (EXISTS (
        SELECT 1 FROM barbers
        WHERE barbers.id = special_hours.barber_id
        AND barbers.user_id = auth.uid()
    ));

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_metadata jsonb;
BEGIN
    -- Get metadata with fallback
    v_metadata := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
    
    -- Create the profile with fallback values
    INSERT INTO public.profiles (id, name, email, role)
    VALUES (
        NEW.id,
        COALESCE(v_metadata->>'name', 'Anonymous'),
        NEW.email,
        COALESCE(v_metadata->>'role', 'client')
    )
    ON CONFLICT (id) DO UPDATE
    SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        role = EXCLUDED.role;
        
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RAISE;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 