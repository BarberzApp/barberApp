-- Add onboarding_complete field to barbers table
ALTER TABLE barbers 
ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;

-- Update existing barbers to have onboarding_complete = true if they have business_name, bio, and specialties
UPDATE barbers 
SET onboarding_complete = true 
WHERE business_name IS NOT NULL 
  AND business_name != '' 
  AND bio IS NOT NULL 
  AND bio != '' 
  AND specialties IS NOT NULL 
  AND array_length(specialties, 1) > 0;

-- Add RLS policy for onboarding_complete field
CREATE POLICY "Users can view their own onboarding_complete status" ON barbers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding_complete status" ON barbers
    FOR UPDATE USING (auth.uid() = user_id);
