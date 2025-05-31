-- Step 1: Drop existing barbers table if it exists
DROP TABLE IF EXISTS public.barbers CASCADE;

-- Step 2: Drop existing handle_new_barber function if it exists
DROP FUNCTION IF EXISTS public.handle_new_barber CASCADE;

-- Step 3: Create new barbers table
CREATE TABLE public.barbers (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
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
  business_id UUID REFERENCES businesses(id),
  role TEXT,
  bio TEXT,
  total_reviews INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 4: Enable Row Level Security
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;

-- Step 5: Create policies
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

-- Step 6: Create new function to handle barber creation
CREATE OR REPLACE FUNCTION public.handle_new_barber()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'role' = 'barber' THEN
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
      false,
      NOW(),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ SECURITY DEFINER;

-- Step 7: Create trigger for new barber creation
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_barber(); 