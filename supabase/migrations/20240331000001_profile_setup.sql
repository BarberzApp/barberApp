-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('client', 'barber', 'business_owner', 'admin');

-- Add role enum to users table
ALTER TABLE users 
    ALTER COLUMN role TYPE user_role USING role::user_role;

-- Function to create appropriate profile based on role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Create appropriate profile based on role
    IF NEW.role = 'barber' THEN
        INSERT INTO public.barbers (user_id, bio, specialties, portfolio, price_range, rating, total_reviews, open_to_hire)
        VALUES (NEW.id, '', ARRAY[]::TEXT[], ARRAY[]::TEXT[], '', 0, 0, false);
    ELSIF NEW.role = 'business_owner' THEN
        INSERT INTO public.businesses (name, owner_id, description, location, phone)
        VALUES ('New Business', NEW.id, '', '', '');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function to handle role changes
CREATE OR REPLACE FUNCTION public.handle_role_change()
RETURNS trigger AS $$
BEGIN
    -- If role changed to barber, create barber profile if doesn't exist
    IF NEW.role = 'barber' AND OLD.role != 'barber' THEN
        INSERT INTO public.barbers (user_id, bio, specialties, portfolio, price_range, rating, total_reviews, open_to_hire)
        VALUES (NEW.id, '', ARRAY[]::TEXT[], ARRAY[]::TEXT[], '', 0, 0, false)
        ON CONFLICT (user_id) DO NOTHING;
    
    -- If role changed to business owner, create business profile if doesn't exist
    ELSIF NEW.role = 'business_owner' AND OLD.role != 'business_owner' THEN
        INSERT INTO public.businesses (name, owner_id, description, location, phone)
        VALUES ('New Business', NEW.id, '', '', '')
        ON CONFLICT (owner_id) DO NOTHING;
    
    -- If role changed from barber, delete barber profile
    ELSIF OLD.role = 'barber' AND NEW.role != 'barber' THEN
        DELETE FROM public.barbers WHERE user_id = OLD.id;
    
    -- If role changed from business owner, delete business profile
    ELSIF OLD.role = 'business_owner' AND NEW.role != 'business_owner' THEN
        DELETE FROM public.businesses WHERE owner_id = OLD.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to handle role changes
CREATE TRIGGER on_user_role_changed
    AFTER UPDATE ON public.users
    FOR EACH ROW
    WHEN (OLD.role IS DISTINCT FROM NEW.role)
    EXECUTE FUNCTION public.handle_role_change();

-- Function to ensure profile data consistency
CREATE OR REPLACE FUNCTION public.ensure_profile_consistency()
RETURNS trigger AS $$
BEGIN
    -- Ensure user exists
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.user_id) THEN
        RAISE EXCEPTION 'User does not exist';
    END IF;
    
    -- Ensure user has correct role
    IF TG_TABLE_NAME = 'barbers' AND 
       NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.user_id AND role = 'barber') THEN
        RAISE EXCEPTION 'User must have barber role';
    ELSIF TG_TABLE_NAME = 'businesses' AND 
          NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.owner_id AND role = 'business_owner') THEN
        RAISE EXCEPTION 'User must have business_owner role';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers to ensure profile consistency
CREATE TRIGGER ensure_barber_consistency
    BEFORE INSERT OR UPDATE ON public.barbers
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_profile_consistency();

CREATE TRIGGER ensure_business_consistency
    BEFORE INSERT OR UPDATE ON public.businesses
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_profile_consistency();

-- Add RLS policies for profile management
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Barbers can manage their profile"
    ON barbers FOR ALL
    USING (user_id = auth.uid());

CREATE POLICY "Business owners can manage their business"
    ON businesses FOR ALL
    USING (owner_id = auth.uid());

-- Add indexes for profile lookups
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_barbers_user_id ON barbers(user_id);
CREATE INDEX idx_businesses_owner_id ON businesses(owner_id); 