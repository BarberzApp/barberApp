-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function with explicit permissions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id uuid;
    v_email text;
    v_name text;
    v_role text;
BEGIN
    -- Get values from NEW
    v_user_id := NEW.id;
    v_email := NEW.email;
    v_name := NEW.raw_user_meta_data->>'name';
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
    
    -- Log the attempt with all values
    RAISE NOTICE 'Creating profile for user: %', v_user_id;
    RAISE NOTICE 'Email: %, Name: %, Role: %', v_email, v_name, v_role;
    
    -- Insert into profiles with explicit column names
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        created_at,
        updated_at
    )
    VALUES (
        v_user_id,
        v_email,
        v_name,
        v_role,
        NOW(),
        NOW()
    );
    
    -- Log success
    RAISE NOTICE 'Successfully created profile for user: %', v_user_id;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log detailed error information
        RAISE NOTICE 'Error creating profile: %', SQLERRM;
        RAISE NOTICE 'Error detail: %', SQLSTATE;
        RAISE NOTICE 'Error context: %', PG_EXCEPTION_CONTEXT;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO anon;

-- Grant specific permissions to the function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Ensure the function owner has the right permissions
ALTER FUNCTION public.handle_new_user() OWNER TO postgres; 