-- Fix the handle_new_user function to generate valid usernames
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_metadata jsonb;
    v_username TEXT;
    v_clean_username TEXT;
BEGIN
    -- Get metadata with fallback
    v_metadata := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
    
    -- Generate username from email if not provided
    v_username := COALESCE(
        v_metadata->>'username',
        LOWER(SPLIT_PART(NEW.email, '@', 1))
    );
    
    -- Clean the username to match the constraint: only letters, numbers, underscores
    v_clean_username := REGEXP_REPLACE(v_username, '[^a-zA-Z0-9_]', '', 'g');
    
    -- Ensure it's at least 3 characters, if not, use a fallback
    IF LENGTH(v_clean_username) < 3 THEN
        v_clean_username := 'user' || FLOOR(RANDOM() * 10000)::TEXT;
    END IF;
    
    -- Truncate if longer than 30 characters
    IF LENGTH(v_clean_username) > 30 THEN
        v_clean_username := LEFT(v_clean_username, 30);
    END IF;
    
    -- Ensure username is unique by appending a number if needed
    WHILE EXISTS (SELECT 1 FROM profiles WHERE username = v_clean_username) LOOP
        v_clean_username := v_clean_username || FLOOR(RANDOM() * 1000)::TEXT;
        -- Truncate again if it gets too long
        IF LENGTH(v_clean_username) > 30 THEN
            v_clean_username := LEFT(v_clean_username, 27) || FLOOR(RANDOM() * 1000)::TEXT;
        END IF;
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
        v_clean_username,
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