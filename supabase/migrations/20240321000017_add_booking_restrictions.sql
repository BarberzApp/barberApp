-- Add booking restrictions and advanced scheduling features

-- Add booking restrictions table
CREATE TABLE IF NOT EXISTS booking_restrictions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
    min_interval_minutes INTEGER DEFAULT 5 CHECK (min_interval_minutes >= 0),
    max_bookings_per_day INTEGER DEFAULT 10 CHECK (max_bookings_per_day >= 0),
    advance_booking_days INTEGER DEFAULT 30 CHECK (advance_booking_days >= 0),
    same_day_booking_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    CONSTRAINT booking_restrictions_barber_id_key UNIQUE (barber_id)
);

-- Add on-demand calling settings table
CREATE TABLE IF NOT EXISTS ondemand_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT false,
    availability_radius_miles INTEGER DEFAULT 5 CHECK (availability_radius_miles >= 1),
    min_notice_minutes INTEGER DEFAULT 30 CHECK (min_notice_minutes >= 0),
    max_notice_hours INTEGER DEFAULT 24 CHECK (max_notice_hours >= 1),
    surge_pricing_enabled BOOLEAN DEFAULT false,
    surge_multiplier DECIMAL DEFAULT 1.5 CHECK (surge_multiplier >= 1.0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    CONSTRAINT ondemand_settings_barber_id_key UNIQUE (barber_id)
);

-- Add advanced scheduling slots table
CREATE TABLE IF NOT EXISTS scheduling_slots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes INTEGER DEFAULT 30 CHECK (slot_duration_minutes >= 15),
    buffer_minutes_before INTEGER DEFAULT 0 CHECK (buffer_minutes_before >= 0),
    buffer_minutes_after INTEGER DEFAULT 0 CHECK (buffer_minutes_after >= 0),
    max_bookings_per_slot INTEGER DEFAULT 1 CHECK (max_bookings_per_slot >= 1),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    CONSTRAINT scheduling_slots_barber_day_time_key UNIQUE (barber_id, day_of_week, start_time)
);

-- Add on-demand requests table
CREATE TABLE IF NOT EXISTS ondemand_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    requested_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_address TEXT,
    status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'completed')) DEFAULT 'pending',
    price DECIMAL NOT NULL,
    surge_multiplier DECIMAL DEFAULT 1.0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_booking_restrictions_barber_id ON booking_restrictions(barber_id);
CREATE INDEX IF NOT EXISTS idx_ondemand_settings_barber_id ON ondemand_settings(barber_id);
CREATE INDEX IF NOT EXISTS idx_scheduling_slots_barber_id ON scheduling_slots(barber_id);
CREATE INDEX IF NOT EXISTS idx_scheduling_slots_day_time ON scheduling_slots(day_of_week, start_time);
CREATE INDEX IF NOT EXISTS idx_ondemand_requests_barber_id ON ondemand_requests(barber_id);
CREATE INDEX IF NOT EXISTS idx_ondemand_requests_status ON ondemand_requests(status);
CREATE INDEX IF NOT EXISTS idx_ondemand_requests_requested_time ON ondemand_requests(requested_time);

-- Enable RLS
ALTER TABLE booking_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondemand_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ondemand_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for booking_restrictions
CREATE POLICY "Barbers can view own booking restrictions"
    ON booking_restrictions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM barbers
        WHERE barbers.id = booking_restrictions.barber_id
        AND barbers.user_id = auth.uid()
    ));

CREATE POLICY "Barbers can manage own booking restrictions"
    ON booking_restrictions FOR ALL
    USING (EXISTS (
        SELECT 1 FROM barbers
        WHERE barbers.id = booking_restrictions.barber_id
        AND barbers.user_id = auth.uid()
    ));

-- RLS Policies for ondemand_settings
CREATE POLICY "Barbers can view own ondemand settings"
    ON ondemand_settings FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM barbers
        WHERE barbers.id = ondemand_settings.barber_id
        AND barbers.user_id = auth.uid()
    ));

CREATE POLICY "Barbers can manage own ondemand settings"
    ON ondemand_settings FOR ALL
    USING (EXISTS (
        SELECT 1 FROM barbers
        WHERE barbers.id = ondemand_settings.barber_id
        AND barbers.user_id = auth.uid()
    ));

-- RLS Policies for scheduling_slots
CREATE POLICY "Scheduling slots are viewable by everyone"
    ON scheduling_slots FOR SELECT
    USING (true);

CREATE POLICY "Barbers can manage own scheduling slots"
    ON scheduling_slots FOR ALL
    USING (EXISTS (
        SELECT 1 FROM barbers
        WHERE barbers.id = scheduling_slots.barber_id
        AND barbers.user_id = auth.uid()
    ));

-- RLS Policies for ondemand_requests
CREATE POLICY "Users can view own ondemand requests"
    ON ondemand_requests FOR SELECT
    USING (auth.uid() = client_id OR EXISTS (
        SELECT 1 FROM barbers
        WHERE barbers.id = ondemand_requests.barber_id
        AND barbers.user_id = auth.uid()
    ));

CREATE POLICY "Users can create ondemand requests"
    ON ondemand_requests FOR INSERT
    WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update own ondemand requests"
    ON ondemand_requests FOR UPDATE
    USING (auth.uid() = client_id OR EXISTS (
        SELECT 1 FROM barbers
        WHERE barbers.id = ondemand_requests.barber_id
        AND barbers.user_id = auth.uid()
    ));

-- Function to validate booking time against restrictions
CREATE OR REPLACE FUNCTION validate_booking_restrictions()
RETURNS TRIGGER AS $$
DECLARE
    restriction RECORD;
    booking_count INTEGER;
    min_interval_minutes INTEGER;
    last_booking_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get booking restrictions
    SELECT * INTO restriction
    FROM booking_restrictions
    WHERE barber_id = NEW.barber_id;
    
    -- If no restrictions, allow booking
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;
    
    -- Check daily booking limit
    SELECT COUNT(*) INTO booking_count
    FROM bookings
    WHERE barber_id = NEW.barber_id
    AND date::DATE = NEW.date::DATE
    AND status != 'cancelled';
    
    IF booking_count >= restriction.max_bookings_per_day THEN
        RAISE EXCEPTION 'Daily booking limit exceeded';
    END IF;
    
    -- Check advance booking limit
    IF restriction.advance_booking_days > 0 THEN
        IF NEW.date > NOW() + (restriction.advance_booking_days || ' days')::INTERVAL THEN
            RAISE EXCEPTION 'Booking too far in advance';
        END IF;
    END IF;
    
    -- Check same day booking
    IF NOT restriction.same_day_booking_enabled THEN
        IF NEW.date::DATE = NOW()::DATE THEN
            RAISE EXCEPTION 'Same day bookings not allowed';
        END IF;
    END IF;
    
    -- Check minimum interval between bookings
    IF restriction.min_interval_minutes > 0 THEN
        SELECT MAX(date) INTO last_booking_time
        FROM bookings
        WHERE barber_id = NEW.barber_id
        AND date::DATE = NEW.date::DATE
        AND status != 'cancelled'
        AND date < NEW.date;
        
        IF last_booking_time IS NOT NULL THEN
            IF NEW.date < last_booking_time + (restriction.min_interval_minutes || ' minutes')::INTERVAL THEN
                RAISE EXCEPTION 'Minimum interval between bookings not met';
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for booking restrictions validation
DROP TRIGGER IF EXISTS validate_booking_restrictions_trigger ON bookings;
CREATE TRIGGER validate_booking_restrictions_trigger
    BEFORE INSERT OR UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION validate_booking_restrictions();

-- Function to auto-expire ondemand requests
CREATE OR REPLACE FUNCTION expire_ondemand_requests()
RETURNS void AS $$
BEGIN
    UPDATE ondemand_requests
    SET status = 'expired'
    WHERE status = 'pending'
    AND requested_time < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Create a cron job to expire requests (this would be set up in Supabase dashboard)
-- SELECT cron.schedule('expire-ondemand-requests', '*/15 * * * *', 'SELECT expire_ondemand_requests();'); 