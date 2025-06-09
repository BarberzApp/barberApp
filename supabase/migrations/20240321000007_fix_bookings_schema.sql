-- Make required columns non-nullable
ALTER TABLE bookings
  ALTER COLUMN barber_id SET NOT NULL,
  ALTER COLUMN service_id SET NOT NULL;

-- Add payment_status column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'bookings' 
    AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE bookings
      ADD COLUMN payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')) DEFAULT 'pending';
  END IF;
END $$;

-- Add guest information columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'bookings' 
    AND column_name = 'guest_name'
  ) THEN
    ALTER TABLE bookings
      ADD COLUMN guest_name TEXT,
      ADD COLUMN guest_email TEXT,
      ADD COLUMN guest_phone TEXT;
  END IF;
END $$;

-- Add notes column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'bookings' 
    AND column_name = 'notes'
  ) THEN
    ALTER TABLE bookings
      ADD COLUMN notes TEXT;
  END IF;
END $$; 