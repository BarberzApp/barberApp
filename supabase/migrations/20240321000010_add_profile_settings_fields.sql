-- Add missing fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sms_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS marketing_emails BOOLEAN DEFAULT false;

-- Add missing fields to barbers table
ALTER TABLE barbers
ADD COLUMN IF NOT EXISTS business_name TEXT;

-- Add constraint for specialties array
ALTER TABLE barbers
ADD CONSTRAINT barbers_specialties_check 
CHECK (array_length(specialties, 1) <= 10);

-- Add index for avatar_url for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_url ON profiles(avatar_url);

-- Add index for business_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_barbers_business_name ON barbers(business_name);

-- Add comment to explain the notification fields
COMMENT ON COLUMN profiles.email_notifications IS 'Whether the user wants to receive email notifications';
COMMENT ON COLUMN profiles.sms_notifications IS 'Whether the user wants to receive SMS notifications';
COMMENT ON COLUMN profiles.marketing_emails IS 'Whether the user wants to receive marketing emails';
COMMENT ON COLUMN profiles.is_public IS 'Whether the profile is visible to other users';
COMMENT ON COLUMN profiles.avatar_url IS 'URL to the user''s avatar image';
COMMENT ON COLUMN barbers.business_name IS 'Name of the barber''s business';

-- Update the handle_new_user function to set default notification preferences
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_metadata jsonb;
BEGIN
    -- Get metadata with fallback
    v_metadata := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
    
    -- Create the profile with fallback values
    INSERT INTO public.profiles (
        id, 
        name, 
        email, 
        role,
        email_notifications,
        sms_notifications,
        marketing_emails,
        is_public
    )
    VALUES (
        NEW.id,
        COALESCE(v_metadata->>'name', 'Anonymous'),
        NEW.email,
        COALESCE(v_metadata->>'role', 'client'),
        true,  -- Default to true for email notifications
        true,  -- Default to true for SMS notifications
        false, -- Default to false for marketing emails
        false  -- Default to false for public profile
    )
    ON CONFLICT (id) DO UPDATE
    SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        role = EXCLUDED.role;
        
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RAISE;
END;
$$; 