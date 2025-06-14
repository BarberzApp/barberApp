-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_profile_role_change ON profiles;
DROP FUNCTION IF EXISTS public.handle_profile_role_change();

-- Create function to handle profile role changes
CREATE OR REPLACE FUNCTION public.handle_profile_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- If role is changed to 'barber', create a barber record
    IF NEW.role = 'barber' AND (OLD.role IS NULL OR OLD.role != 'barber') THEN
        INSERT INTO public.barbers (user_id, bio, specialties, created_at, updated_at)
        VALUES (
            NEW.id,
            NEW.bio,
            '{}'::text[],
            NEW.created_at,
            NEW.updated_at
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    -- If role is changed from 'barber' to something else, delete the barber record
    IF OLD.role = 'barber' AND NEW.role != 'barber' THEN
        DELETE FROM public.barbers WHERE user_id = OLD.id;
    END IF;

    RETURN NEW;
END;
$$;

-- Create trigger for profile role changes
CREATE TRIGGER on_profile_role_change
    AFTER INSERT OR UPDATE OF role ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_profile_role_change();

-- Add comment to explain the trigger
COMMENT ON FUNCTION public.handle_profile_role_change() IS 'Automatically creates or deletes barber records when profile role changes to/from barber';

-- Backfill existing barber profiles
INSERT INTO public.barbers (user_id, bio, specialties, created_at, updated_at)
SELECT 
    id,
    bio,
    '{}'::text[],
    created_at,
    updated_at
FROM public.profiles
WHERE role = 'barber'
ON CONFLICT (user_id) DO NOTHING; 