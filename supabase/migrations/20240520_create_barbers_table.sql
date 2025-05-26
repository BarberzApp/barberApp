-- Create barbers table
CREATE TABLE IF NOT EXISTS barbers (
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Barbers can view their own profile"
ON barbers FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Barbers can update their own profile"
ON barbers FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Anyone can view barber profiles"
ON barbers FOR SELECT
USING (true);

-- Create function to handle barber creation
CREATE OR REPLACE FUNCTION public.handle_new_barber()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'role' = 'barber' THEN
    INSERT INTO public.barbers (id, name, email, role)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'name',
      NEW.email,
      'barber'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new barber creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_barber(); 