-- Fix payment constraints that were causing syntax errors
-- First ensure the required columns exist
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(10,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS barber_payout NUMERIC(10,2);

-- Drop existing constraints if they exist
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS check_payment_amounts;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS check_payment_status;
ALTER TABLE barbers DROP CONSTRAINT IF EXISTS check_stripe_account_status;

-- Add constraint to ensure payment amounts match (only if both fee and payout are provided)
ALTER TABLE bookings
ADD CONSTRAINT check_payment_amounts 
CHECK (
    (platform_fee IS NULL AND barber_payout IS NULL) OR
    (platform_fee IS NOT NULL AND barber_payout IS NOT NULL AND platform_fee + barber_payout = price)
);

-- Add constraint to ensure valid payment status
ALTER TABLE bookings
ADD CONSTRAINT check_payment_status 
CHECK (
    payment_status IN ('pending', 'succeeded', 'failed', 'refunded', 'partially_refunded')
);

-- Add constraint to ensure valid stripe account status
ALTER TABLE barbers
ADD CONSTRAINT check_stripe_account_status 
CHECK (
    stripe_account_status IN ('pending', 'active', 'restricted', 'disabled', 'deauthorized', 'rejected')
); 