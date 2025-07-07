-- Add is_disabled field to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN DEFAULT FALSE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_disabled ON profiles(is_disabled);

-- Add RLS policy for disabled accounts (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users cannot access disabled accounts'
    ) THEN
        CREATE POLICY "Users cannot access disabled accounts" ON profiles
            FOR ALL USING (is_disabled = FALSE OR auth.uid() = id);
    END IF;
END $$;

-- Update existing RLS policies to consider disabled status
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id AND is_disabled = FALSE);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id AND is_disabled = FALSE);

-- Add comment for documentation
COMMENT ON COLUMN profiles.is_disabled IS 'Flag to disable user accounts. Disabled accounts cannot access the platform.'; 