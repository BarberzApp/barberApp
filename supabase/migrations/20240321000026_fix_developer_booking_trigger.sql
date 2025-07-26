-- Fix the validate_barber_stripe_ready function to allow developer accounts
CREATE OR REPLACE FUNCTION validate_barber_stripe_ready()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow developer accounts to bypass Stripe requirements
    IF EXISTS (
        SELECT 1 FROM barbers
        WHERE barbers.id = NEW.barber_id
        AND barbers.is_developer = true
    ) THEN
        RETURN NEW;
    END IF;
    
    -- For non-developer accounts, require Stripe Connect onboarding
    IF NOT EXISTS (
        SELECT 1 FROM barbers
        WHERE barbers.id = NEW.barber_id
        AND barbers.stripe_account_ready = true
    ) THEN
        RAISE EXCEPTION 'Barber must complete Stripe Connect onboarding before accepting bookings';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 