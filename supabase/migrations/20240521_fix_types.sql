-- Update status enums to match TypeScript
ALTER TABLE bookings 
  ALTER COLUMN status TYPE TEXT 
  CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'));

-- Add payment_status column
ALTER TABLE bookings 
  ADD COLUMN payment_status TEXT 
  CHECK (payment_status IN ('pending', 'paid', 'refunded'));

-- Add location to barbers table
ALTER TABLE barbers
  ADD COLUMN location TEXT;

-- Add services array to barbers table
ALTER TABLE barbers
  ADD COLUMN services JSONB DEFAULT '[]'::jsonb;

-- Add portfolio array to barbers table
ALTER TABLE barbers
  ADD COLUMN portfolio TEXT[] DEFAULT '{}';

-- Add availability to barbers table
ALTER TABLE barbers
  ADD COLUMN availability JSONB DEFAULT '{}'::jsonb;

-- Add earnings to barbers table
ALTER TABLE barbers
  ADD COLUMN earnings JSONB DEFAULT '{
    "thisWeek": 0,
    "thisMonth": 0,
    "lastMonth": 0
  }'::jsonb;

-- Add total_clients and total_bookings to barbers table
ALTER TABLE barbers
  ADD COLUMN total_clients INTEGER DEFAULT 0,
  ADD COLUMN total_bookings INTEGER DEFAULT 0;

-- Update reviews table to match TypeScript types
ALTER TABLE reviews
  ADD COLUMN client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ADD COLUMN comment TEXT;

-- Add favorites array to profiles table
ALTER TABLE profiles
  ADD COLUMN favorites TEXT[] DEFAULT '{}';

-- Add wallet to profiles table
ALTER TABLE profiles
  ADD COLUMN wallet DECIMAL(10,2) DEFAULT 0;

-- Add stripe fields to profiles table
ALTER TABLE profiles
  ADD COLUMN stripe_customer_id TEXT,
  ADD COLUMN stripe_account_id TEXT;

-- Add business fields to profiles table
ALTER TABLE profiles
  ADD COLUMN business_name TEXT,
  ADD COLUMN business_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Add description and bio to profiles table
ALTER TABLE profiles
  ADD COLUMN description TEXT,
  ADD COLUMN bio TEXT;

-- Add join_date to profiles table
ALTER TABLE profiles
  ADD COLUMN join_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

-- Add specialties array to profiles table
ALTER TABLE profiles
  ADD COLUMN specialties TEXT[] DEFAULT '{}'; 