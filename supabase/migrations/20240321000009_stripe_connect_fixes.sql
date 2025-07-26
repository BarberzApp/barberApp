-- Create payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_intent_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'usd',
    status TEXT NOT NULL,
    barber_stripe_account_id TEXT NOT NULL,
    platform_fee INTEGER NOT NULL,
    barber_payout INTEGER NOT NULL,
    booking_id UUID NOT NULL REFERENCES bookings(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure payments.booking_id exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='payments' AND column_name='booking_id'
    ) THEN
        ALTER TABLE payments
        ADD COLUMN booking_id uuid REFERENCES bookings(id);
    END IF;
END $$;

-- Add function to validate barber stripe ready status
CREATE OR REPLACE FUNCTION validate_barber_stripe_ready()
RETURNS TRIGGER AS $$
BEGIN
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

-- Add trigger for barber stripe ready validation
CREATE TRIGGER validate_barber_stripe_ready_trigger
BEFORE INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION validate_barber_stripe_ready();

-- Add constraint for payment_status if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'bookings_payment_status_check'
    ) THEN
        ALTER TABLE bookings
        ADD CONSTRAINT bookings_payment_status_check
        CHECK (payment_status IN ('pending', 'succeeded', 'failed', 'refunded'));
    END IF;
END $$;

-- Add constraint for booking status if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'bookings_status_check'
    ) THEN
        ALTER TABLE bookings
        ADD CONSTRAINT bookings_status_check
        CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show'));
    END IF;
END $$;

-- Add RLS policies for payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Allow barbers to view their own payments
CREATE POLICY "Barbers can view own payments"
ON payments
FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 FROM barbers
        WHERE barbers.id = (
            SELECT barber_id FROM bookings
            WHERE bookings.id = payments.booking_id
        )
        AND barbers.user_id = auth.uid()
    )
);

-- Allow clients to view their own payments
CREATE POLICY "Clients can view own payments"
ON payments
FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 FROM bookings
        WHERE bookings.id = payments.booking_id
        AND bookings.client_id = auth.uid()
    )
);

-- Allow platform to manage all payments
CREATE POLICY "Platform can manage all payments"
ON payments
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Add trigger to ensure payment records are created
CREATE OR REPLACE FUNCTION create_payment_record()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.payment_intent_id IS NOT NULL AND NEW.payment_status = 'succeeded' THEN
        INSERT INTO payments (
            payment_intent_id,
            amount,
            currency,
            status,
            barber_stripe_account_id,
            platform_fee,
            barber_payout,
            booking_id,
            created_at,
            updated_at
        )
        SELECT
            NEW.payment_intent_id,
            NEW.price::integer,
            'usd',
            NEW.payment_status,
            b.stripe_account_id,
            NEW.platform_fee::integer,
            NEW.barber_payout::integer,
            NEW.id,
            NOW(),
            NOW()
        FROM barbers b
        WHERE b.id = NEW.barber_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_payment_record_trigger
AFTER UPDATE ON bookings
FOR EACH ROW
WHEN (NEW.payment_status = 'succeeded' AND OLD.payment_status != 'succeeded')
EXECUTE FUNCTION create_payment_record(); 