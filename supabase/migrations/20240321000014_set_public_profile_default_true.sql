-- Change the default value of is_public to true for new profiles
ALTER TABLE profiles ALTER COLUMN is_public SET DEFAULT true;

-- Update the handle_new_user function to set is_public to true by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_metadata jsonb;
    v_username TEXT;
BEGIN
    -- Get metadata with fallback
    v_metadata := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
    
    -- Generate username from email if not provided
    v_username := COALESCE(
        v_metadata->>'username',
        LOWER(SPLIT_PART(NEW.email, '@', 1))
    );
    
    -- Ensure username is unique by appending a number if needed
    WHILE EXISTS (SELECT 1 FROM profiles WHERE username = v_username) LOOP
        v_username := v_username || FLOOR(RANDOM() * 1000)::TEXT;
    END LOOP;
    
    -- Create the profile with fallback values
    INSERT INTO public.profiles (
        id, 
        name, 
        email, 
        role,
        username,
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
        v_username,
        true,  -- Default to true for email notifications
        true,  -- Default to true for SMS notifications
        false, -- Default to false for marketing emails
        true   -- Default to true for public profile
    )
    ON CONFLICT (id) DO UPDATE
    SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        username = EXCLUDED.username;
        
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RAISE;
END;
$$; 