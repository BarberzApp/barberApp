-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 1: Create businesses table first (since barbers reference it)
CREATE TABLE IF NOT EXISTS public.businesses (
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

-- Step 2: Drop existing barbers table and function
DROP TABLE IF EXISTS public.barbers CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_barber CASCADE;

-- Step 3: Create new barbers table
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
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 4: Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT CHECK (role IN ('client', 'barber', 'business')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 5: Enable Row Level Security
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Create policies
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

-- Businesses policies
CREATE POLICY "Businesses are viewable by everyone"
ON public.businesses FOR SELECT
USING (true);

CREATE POLICY "Business owners can update own profile"
ON public.businesses FOR UPDATE
USING (auth.uid() = id);

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Step 7: Create function to handle new barber creation
CREATE OR REPLACE FUNCTION public.handle_new_barber()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Create profile first
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'name',
        'barber',
        NOW(),
        NOW()
    );

    -- Then create barber record
    INSERT INTO public.barbers (
        id,
        name,
        email,
        role,
        is_public,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'name',
        NEW.email,
        'barber',
        true,
        NOW(),
        NOW()
    );

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error and continue
        RAISE NOTICE 'Error in handle_new_barber: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Step 8: Create trigger for new barber creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    WHEN (NEW.raw_user_meta_data->>'role' = 'barber')
    EXECUTE FUNCTION public.handle_new_barber();

-- Step 9: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON public.barbers TO authenticated;
GRANT ALL ON public.businesses TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.barbers TO anon;
GRANT ALL ON public.businesses TO anon;
GRANT ALL ON public.profiles TO anon; 