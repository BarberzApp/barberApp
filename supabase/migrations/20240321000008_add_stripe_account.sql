-- Add stripe_account_id column to barbers table
ALTER TABLE barbers
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_barbers_stripe_account_id ON barbers(stripe_account_id); 