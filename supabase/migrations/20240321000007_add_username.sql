-- Add username column to profiles table
ALTER TABLE profiles
ADD COLUMN username TEXT UNIQUE,
ADD CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]{3,30}$');

-- Create index for faster username lookups
CREATE INDEX idx_profiles_username ON profiles(username);

-- Update the handle_new_user function to handle usernames
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
    -- Log the incoming data
    RAISE LOG 'Creating profile for user: %', NEW.id;
    RAISE LOG 'User metadata: %', NEW.raw_user_meta_data;
    
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
    
    -- Insert into profiles table
    INSERT INTO public.profiles (
        id,
        email,
        name,
        role,
        username
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(v_metadata->>'name', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(v_metadata->>'role', 'client'),
        v_username
    );
    
    RETURN NEW;
END;
$$;

-- Add RLS policies for username-based access
CREATE POLICY "Users can view profiles by username"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own username"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND
        username ~ '^[a-zA-Z0-9_]{3,30}$' AND
        NOT EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.username = username
            AND p.id != auth.uid()
        )
    );

-- Add function to get profile by username
CREATE OR REPLACE FUNCTION public.get_profile_by_username(username_param TEXT)
RETURNS SETOF profiles
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT * FROM profiles WHERE username = username_param;
$$; 