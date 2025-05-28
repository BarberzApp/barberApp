-- Enable RLS on barbers table if not already enabled
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view public barbers" ON barbers;
DROP POLICY IF EXISTS "Users can update their own barber profile" ON barbers;
DROP POLICY IF EXISTS "Users can insert their own barber profile" ON barbers;

-- Create policy for viewing public barbers
CREATE POLICY "Users can view public barbers"
ON barbers FOR SELECT
USING ("isPublic" = true);

-- Create policy for users to update their own barber profile
CREATE POLICY "Users can update their own barber profile"
ON barbers FOR UPDATE
USING (auth.uid() = id);

-- Create policy for users to insert their own barber profile
CREATE POLICY "Users can insert their own barber profile"
ON barbers FOR INSERT
WITH CHECK (auth.uid() = id);

-- Grant necessary permissions
GRANT SELECT ON barbers TO authenticated;
GRANT UPDATE ON barbers TO authenticated;
GRANT INSERT ON barbers TO authenticated; 