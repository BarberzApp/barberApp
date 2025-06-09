-- Drop existing triggers and functions first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
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
DROP POLICY IF EXISTS "Enable insert for trigger function" ON profiles;

-- Drop existing tables if they exist (in correct order due to dependencies)
DROP TABLE IF EXISTS availability CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS barbers CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS special_hours CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    role TEXT CHECK (role IN ('client', 'barber')),
    phone TEXT,
    location TEXT,
    description TEXT,
    bio TEXT,
    favorites UUID[] DEFAULT '{}',
    join_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    CONSTRAINT profiles_email_key UNIQUE (email)
);

-- Create barbers table
CREATE TABLE IF NOT EXISTS barbers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    bio TEXT,
    specialties TEXT[] DEFAULT '{}',
    price_range TEXT,
    next_available TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    CONSTRAINT barbers_user_id_key UNIQUE (user_id)
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL, -- in minutes
    price DECIMAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    CONSTRAINT services_barber_name_key UNIQUE (barber_id, name)
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE NULL,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')) DEFAULT 'pending',
    price DECIMAL NOT NULL,
    payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')) DEFAULT 'pending',
    notes TEXT,
    guest_name TEXT,
    guest_email TEXT,
    guest_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    CONSTRAINT bookings_barber_client_date_key UNIQUE (barber_id, COALESCE(client_id, '00000000-0000-0000-0000-000000000000'::uuid), date)
);

-- Create availability table
CREATE TABLE IF NOT EXISTS availability (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    CONSTRAINT availability_barber_day_key UNIQUE (barber_id, day_of_week)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create special_hours table for handling special business hours
CREATE TABLE IF NOT EXISTS special_hours (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_closed BOOLEAN DEFAULT false,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    CONSTRAINT special_hours_barber_date_key UNIQUE (barber_id, date)
);

-- Create RLS policies
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

-- Allow the trigger function to create profiles
CREATE POLICY "Enable insert for trigger function"
    ON profiles FOR INSERT
    WITH CHECK (true);

-- Barbers policies
CREATE POLICY "Barbers are viewable by everyone"
    ON barbers FOR SELECT
    USING (true);

CREATE POLICY "Barbers can update own profile"
    ON barbers FOR UPDATE
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
CREATE POLICY "Users can view own bookings"
    ON bookings FOR SELECT
    USING (auth.uid() = client_id OR EXISTS (
        SELECT 1 FROM barbers
        WHERE barbers.id = bookings.barber_id
        AND barbers.user_id = auth.uid()
    ));

CREATE POLICY "Users can create bookings"
    ON bookings FOR INSERT
    WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update own bookings"
    ON bookings FOR UPDATE
    USING (auth.uid() = client_id OR EXISTS (
        SELECT 1 FROM barbers
        WHERE barbers.id = bookings.barber_id
        AND barbers.user_id = auth.uid()
    ));

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
    -- Log the incoming data
    RAISE LOG 'Creating profile for user: %', NEW.id;
    RAISE LOG 'User metadata: %', NEW.raw_user_meta_data;
    
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
        
    RAISE LOG 'Profile created successfully for user: %', NEW.id;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RAISE LOG 'Error context: %', pg_exception_context();
        RAISE;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Set up permissions for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role, authenticator;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role, authenticator;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role, authenticator;

-- Grant necessary permissions to roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, authenticator;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role, authenticator;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role, authenticator;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role, authenticator;

-- Grant specific permissions to authenticator role
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticator;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticator;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticator; 