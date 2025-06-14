-- Add stripe_account_status column to barbers table
ALTER TABLE barbers
ADD COLUMN IF NOT EXISTS stripe_account_status TEXT CHECK (stripe_account_status IN ('pending', 'active', 'deauthorized')) DEFAULT 'pending';

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_barbers_stripe_account_status ON barbers(stripe_account_status); 