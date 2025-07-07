-- Add is_developer column to barbers table
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS is_developer BOOLEAN DEFAULT FALSE;

-- Optional: comment for clarity
COMMENT ON COLUMN barbers.is_developer IS 'If true, this barber is a developer and bypasses Stripe fees.'; 