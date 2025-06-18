-- Add new fields to barbers table
ALTER TABLE barbers
ADD COLUMN IF NOT EXISTS stripe_account_ready BOOLEAN DEFAULT FALSE;

-- Add new fields to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS barber_payout NUMERIC(10,2);

-- Add new fields to payments table
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS barber_payout INTEGER,
ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create index for payment_intent_id in bookings for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_payment_intent_id ON bookings(payment_intent_id);

-- Create index for booking_id in payments for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);

-- Add constraint to ensure payment amounts match
ALTER TABLE bookings
ADD CONSTRAINT check_payment_amounts 
CHECK (
    (platform_fee IS NULL AND barber_payout IS NULL) OR
    (platform_fee + barber_payout = price)
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
    stripe_account_status IN ('pending', 'active', 'deauthorized', 'rejected')
);

-- Update existing records to set stripe_account_ready based on stripe_account_status
UPDATE barbers
SET stripe_account_ready = (stripe_account_status = 'active')
WHERE stripe_account_status IS NOT NULL;

-- Add trigger to update updated_at in payments table
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_payments_updated_at();

-- Add comment to explain the payment split
COMMENT ON COLUMN bookings.platform_fee IS 'Platform fee amount (60% of total price)';
COMMENT ON COLUMN bookings.barber_payout IS 'Barber payout amount (40% of total price)';
COMMENT ON COLUMN payments.platform_fee IS 'Platform fee amount in cents';
COMMENT ON COLUMN payments.barber_payout IS 'Barber payout amount in cents'; 