-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Reset database if needed
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Create base tables
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT CHECK (role IN ('client', 'barber', 'business')) NOT NULL,
    description TEXT,
    bio TEXT,
    business_name TEXT,
    business_id UUID,
    wallet DECIMAL(10,2) DEFAULT 0,
    stripe_customer_id TEXT,
    stripe_account_id TEXT,
    favorites TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.businesses (
    id UUID PRIMARY KEY,
    business_name TEXT NOT NULL,
    description TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    phone TEXT,
    website TEXT,
    operating_hours JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.barbers (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    rating DECIMAL(3,2) DEFAULT 0,
    specialties TEXT[] DEFAULT '{}',
    image TEXT,
    location TEXT,
    next_available TIMESTAMP WITH TIME ZONE,
    open_to_hire BOOLEAN DEFAULT false,
    price_range TEXT,
    portfolio TEXT[] DEFAULT '{}',
    featured BOOLEAN DEFAULT false,
    trending BOOLEAN DEFAULT false,
    business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
    role TEXT,
    bio TEXT,
    total_reviews INTEGER DEFAULT 0,
    total_bookings INTEGER DEFAULT 0,
    total_clients INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    services JSONB DEFAULT '[]'::jsonb,
    availability JSONB DEFAULT '{}'::jsonb,
    earnings JSONB DEFAULT '{
        "thisWeek": 0,
        "thisMonth": 0,
        "lastMonth": 0
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')) NOT NULL,
    payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'refunded')) NOT NULL DEFAULT 'pending',
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Businesses policies
CREATE POLICY "Businesses are viewable by everyone"
ON public.businesses FOR SELECT
USING (true);

CREATE POLICY "Business owners can update own profile"
ON public.businesses FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Business owners can insert own profile"
ON public.businesses FOR INSERT
WITH CHECK (auth.uid() = id);

-- Barbers policies
CREATE POLICY "Barbers can view their own profile"
ON public.barbers FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Barbers can update their own profile"
ON public.barbers FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Anyone can view public barber profiles"
ON public.barbers FOR SELECT
USING (is_public = true);

CREATE POLICY "Barbers can insert their own profile"
ON public.barbers FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Barbers can delete their own profile"
ON public.barbers FOR DELETE
USING (auth.uid() = id);

-- Services policies
CREATE POLICY "Services are viewable by everyone"
ON public.services FOR SELECT
USING (true);

CREATE POLICY "Barbers can manage own services"
ON public.services FOR ALL
USING (auth.uid() = barber_id);

CREATE POLICY "Barbers can delete own services"
ON public.services FOR DELETE
USING (auth.uid() = barber_id);

-- Bookings policies
CREATE POLICY "Users can view own bookings"
ON public.bookings FOR SELECT
USING (auth.uid() = client_id OR auth.uid() = barber_id);

CREATE POLICY "Users can create bookings"
ON public.bookings FOR INSERT
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update own bookings"
ON public.bookings FOR UPDATE
USING (auth.uid() = client_id OR auth.uid() = barber_id);

CREATE POLICY "Users can delete own bookings"
ON public.bookings FOR DELETE
USING (auth.uid() = client_id OR auth.uid() = barber_id);

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone"
ON public.reviews FOR SELECT
USING (true);

CREATE POLICY "Users can create reviews"
ON public.reviews FOR INSERT
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update own reviews"
ON public.reviews FOR UPDATE
USING (auth.uid() = client_id);

CREATE POLICY "Users can delete own reviews"
ON public.reviews FOR DELETE
USING (auth.uid() = client_id);

-- Messages policies
CREATE POLICY "Users can view own messages"
ON public.messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own messages"
ON public.messages FOR UPDATE
USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete own messages"
ON public.messages FOR DELETE
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- Create functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role TEXT;
    user_name TEXT;
BEGIN
    -- Extract user metadata
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
    user_name := NEW.raw_user_meta_data->>'name';

    -- Create base profile for all users
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        description,
        bio,
        business_name,
        business_id,
        wallet,
        stripe_customer_id,
        stripe_account_id,
        favorites,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        user_name,
        user_role,
        NULL,
        NULL,
        CASE 
            WHEN user_role = 'business' THEN user_name
            ELSE NULL
        END,
        CASE 
            WHEN user_role = 'business' THEN NEW.id
            ELSE NULL
        END,
        0,
        NULL,
        NULL,
        '{}',
        NOW(),
        NOW()
    );

    -- If user is a barber, create barber record
    IF user_role = 'barber' THEN
        INSERT INTO public.barbers (
            id,
            name,
            email,
            role,
            is_public,
            rating,
            specialties,
            total_reviews,
            total_bookings,
            total_clients,
            services,
            availability,
            earnings,
            created_at,
            updated_at
        )
        VALUES (
            NEW.id,
            user_name,
            NEW.email,
            'barber',
            true,
            0,
            '{}',
            0,
            0,
            0,
            '[]',
            '{}',
            '{
                "thisWeek": 0,
                "thisMonth": 0,
                "lastMonth": 0
            }',
            NOW(),
            NOW()
        );
    END IF;

    -- If user is a business, create business record
    IF user_role = 'business' THEN
        INSERT INTO public.businesses (
            id,
            business_name,
            description,
            address,
            city,
            state,
            zip_code,
            phone,
            website,
            operating_hours,
            created_at,
            updated_at
        )
        VALUES (
            NEW.id,
            user_name,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            '{}',
            NOW(),
            NOW()
        );
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error and continue
        RAISE NOTICE 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at triggers for all tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at
    BEFORE UPDATE ON public.businesses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_barbers_updated_at
    BEFORE UPDATE ON public.barbers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.businesses TO authenticated;
GRANT ALL ON public.barbers TO authenticated;
GRANT ALL ON public.services TO authenticated;
GRANT ALL ON public.bookings TO authenticated;
GRANT ALL ON public.reviews TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.businesses TO anon;
GRANT ALL ON public.barbers TO anon;
GRANT ALL ON public.services TO anon;
GRANT ALL ON public.bookings TO anon;
GRANT ALL ON public.reviews TO anon;
GRANT ALL ON public.messages TO anon;
GRANT ALL ON public.notifications TO anon; 