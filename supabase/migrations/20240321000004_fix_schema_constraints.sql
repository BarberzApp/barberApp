-- Fix barbers table constraints
ALTER TABLE barbers ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE barbers ADD CONSTRAINT barbers_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE barbers ADD CONSTRAINT barbers_specialties_check CHECK (array_length(specialties, 1) <= 10);
ALTER TABLE barbers ADD CONSTRAINT barbers_stripe_account_status_check CHECK (stripe_account_status IN ('pending', 'active', 'restricted', 'disabled'));
ALTER TABLE barbers ADD CONSTRAINT barbers_user_id_key UNIQUE (user_id);

-- Fix profiles table constraints
ALTER TABLE profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
ALTER TABLE profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
ALTER TABLE profiles ADD CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]{3,30}$');
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('client', 'barber', 'admin'));

-- Fix bookings table constraints
ALTER TABLE bookings ADD CONSTRAINT bookings_client_or_guest_check CHECK (
    (client_id IS NOT NULL) OR 
    (guest_name IS NOT NULL AND guest_email IS NOT NULL AND guest_phone IS NOT NULL)
);
ALTER TABLE bookings ADD CONSTRAINT bookings_price_check CHECK (price > 0);
ALTER TABLE bookings ADD CONSTRAINT bookings_date_check CHECK (date > NOW());
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'));
ALTER TABLE bookings ADD CONSTRAINT bookings_payment_status_check CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));
ALTER TABLE bookings ADD CONSTRAINT bookings_barber_id_fkey FOREIGN KEY (barber_id) REFERENCES barbers(id) ON DELETE CASCADE;
ALTER TABLE bookings ADD CONSTRAINT bookings_client_id_fkey FOREIGN KEY (client_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD CONSTRAINT bookings_service_id_fkey FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT;

-- Fix services table constraints
ALTER TABLE services ADD CONSTRAINT services_price_check CHECK (price > 0);
ALTER TABLE services ADD CONSTRAINT services_duration_check CHECK (duration > 0 AND duration <= 480); -- Max 8 hours
ALTER TABLE services ADD CONSTRAINT services_barber_id_fkey FOREIGN KEY (barber_id) REFERENCES barbers(id) ON DELETE CASCADE;
ALTER TABLE services ADD CONSTRAINT services_barber_name_key UNIQUE (barber_id, name);

-- Fix availability table constraints
ALTER TABLE availability ADD CONSTRAINT availability_day_of_week_check CHECK (day_of_week >= 0 AND day_of_week <= 6);
ALTER TABLE availability ADD CONSTRAINT availability_time_check CHECK (start_time < end_time);
ALTER TABLE availability ADD CONSTRAINT availability_barber_id_fkey FOREIGN KEY (barber_id) REFERENCES barbers(id) ON DELETE CASCADE;
ALTER TABLE availability ADD CONSTRAINT availability_barber_day_key UNIQUE (barber_id, day_of_week);

-- Fix special_hours table constraints
ALTER TABLE special_hours ADD CONSTRAINT special_hours_time_check CHECK (start_time < end_time);
ALTER TABLE special_hours ADD CONSTRAINT special_hours_date_check CHECK (date >= CURRENT_DATE);
ALTER TABLE special_hours ADD CONSTRAINT special_hours_barber_id_fkey FOREIGN KEY (barber_id) REFERENCES barbers(id) ON DELETE CASCADE;
ALTER TABLE special_hours ADD CONSTRAINT special_hours_barber_date_key UNIQUE (barber_id, date);

-- Fix notifications table constraints
ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD CONSTRAINT notifications_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_barber_id ON bookings(barber_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_availability_barber_id ON availability(barber_id);
CREATE INDEX IF NOT EXISTS idx_special_hours_barber_id ON special_hours(barber_id);
CREATE INDEX IF NOT EXISTS idx_services_barber_id ON services(barber_id);

-- Add function to validate booking time against availability
CREATE OR REPLACE FUNCTION validate_booking_time()
RETURNS TRIGGER AS $$
DECLARE
    booking_day_of_week INTEGER;
    booking_time TIME;
    is_available BOOLEAN;
    is_special_hours BOOLEAN;
BEGIN
    -- Get booking day of week and time
    booking_day_of_week := EXTRACT(DOW FROM NEW.date);
    booking_time := NEW.date::TIME;
    
    -- Check regular availability
    SELECT EXISTS (
        SELECT 1 FROM availability
        WHERE barber_id = NEW.barber_id
        AND day_of_week = booking_day_of_week
        AND start_time <= booking_time
        AND end_time >= booking_time
    ) INTO is_available;
    
    -- Check special hours
    SELECT EXISTS (
        SELECT 1 FROM special_hours
        WHERE barber_id = NEW.barber_id
        AND date = NEW.date::DATE
        AND NOT is_closed
        AND start_time <= booking_time
        AND end_time >= booking_time
    ) INTO is_special_hours;
    
    -- If neither regular availability nor special hours match, raise error
    IF NOT (is_available OR is_special_hours) THEN
        RAISE EXCEPTION 'Booking time is not within barber availability';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for booking time validation
DROP TRIGGER IF EXISTS validate_booking_time_trigger ON bookings;
CREATE TRIGGER validate_booking_time_trigger
    BEFORE INSERT OR UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION validate_booking_time();

-- Add function to check for booking conflicts
CREATE OR REPLACE FUNCTION check_booking_conflicts()
RETURNS TRIGGER AS $$
DECLARE
    service_duration INTEGER;
    booking_end_time TIMESTAMP WITH TIME ZONE;
    conflicting_booking BOOLEAN;
BEGIN
    -- Get service duration
    SELECT duration INTO service_duration
    FROM services
    WHERE id = NEW.service_id;
    
    -- Calculate booking end time
    booking_end_time := NEW.date + (service_duration || ' minutes')::INTERVAL;
    
    -- Check for conflicts
    SELECT EXISTS (
        SELECT 1 FROM bookings b
        JOIN services s ON b.service_id = s.id
        WHERE b.barber_id = NEW.barber_id
        AND b.id != NEW.id
        AND b.status != 'cancelled'
        AND (
            (NEW.date, booking_end_time) OVERLAPS 
            (b.date, b.date + (s.duration || ' minutes')::INTERVAL)
        )
    ) INTO conflicting_booking;
    
    IF conflicting_booking THEN
        RAISE EXCEPTION 'Booking time conflicts with existing booking';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for booking conflict check
DROP TRIGGER IF EXISTS check_booking_conflicts_trigger ON bookings;
CREATE TRIGGER check_booking_conflicts_trigger
    BEFORE INSERT OR UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION check_booking_conflicts(); 