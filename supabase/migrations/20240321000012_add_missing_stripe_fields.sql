-- Add missing Stripe fields to barbers table
ALTER TABLE barbers
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_account_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS stripe_account_ready BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS business_name TEXT;

-- Add constraint for stripe account status (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'barbers_stripe_account_status_check'
    ) THEN
        ALTER TABLE barbers
        ADD CONSTRAINT barbers_stripe_account_status_check 
        CHECK (stripe_account_status IN ('pending', 'active', 'restricted', 'disabled', 'deauthorized', 'rejected'));
    END IF;
END $$;

-- Create index for stripe_account_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_barbers_stripe_account_id ON barbers(stripe_account_id);

-- Create index for stripe_account_status for faster lookups
CREATE INDEX IF NOT EXISTS idx_barbers_stripe_account_status ON barbers(stripe_account_status);

-- Create index for business_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_barbers_business_name ON barbers(business_name);

-- Add comment to explain the fields
COMMENT ON COLUMN barbers.stripe_account_id IS 'Stripe Connect account ID (acct_...)';
COMMENT ON COLUMN barbers.stripe_account_status IS 'Status of the Stripe Connect account';
COMMENT ON COLUMN barbers.stripe_account_ready IS 'Whether the Stripe account is ready to accept payments';
COMMENT ON COLUMN barbers.business_name IS 'Name of the barber''s business'; 