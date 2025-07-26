-- Add service add-ons functionality

-- Create service_addons table
CREATE TABLE IF NOT EXISTS service_addons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    CONSTRAINT service_addons_barber_name_key UNIQUE (barber_id, name)
);

-- Create booking_addons table to track which add-ons were selected for each booking
CREATE TABLE IF NOT EXISTS booking_addons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    addon_id UUID REFERENCES service_addons(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    CONSTRAINT booking_addons_booking_addon_key UNIQUE (booking_id, addon_id)
);

-- Add addon_total field to bookings table to track total add-on cost
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS addon_total DECIMAL(10,2) DEFAULT 0 CHECK (addon_total >= 0);

-- Enable RLS on new tables
ALTER TABLE service_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_addons ENABLE ROW LEVEL SECURITY;

-- RLS policies for service_addons
CREATE POLICY "Service addons are viewable by everyone"
    ON service_addons FOR SELECT
    USING (true);

CREATE POLICY "Barbers can manage own service addons"
    ON service_addons FOR ALL
    USING (EXISTS (
        SELECT 1 FROM barbers
        WHERE barbers.id = service_addons.barber_id
        AND barbers.user_id = auth.uid()
    ));

-- RLS policies for booking_addons
CREATE POLICY "Booking addons are viewable by booking participants"
    ON booking_addons FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM bookings
        WHERE bookings.id = booking_addons.booking_id
        AND (
            bookings.barber_id IN (
                SELECT id FROM barbers WHERE user_id = auth.uid()
            )
            OR bookings.client_id = auth.uid()
        )
    ));

CREATE POLICY "Booking addons can be created during booking process"
    ON booking_addons FOR INSERT
    WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_addons_barber_id ON service_addons(barber_id);
CREATE INDEX IF NOT EXISTS idx_service_addons_active ON service_addons(is_active);
CREATE INDEX IF NOT EXISTS idx_booking_addons_booking_id ON booking_addons(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_addons_addon_id ON booking_addons(addon_id);

-- Add comments for documentation
COMMENT ON TABLE service_addons IS 'Additional services or items that barbers can offer (e.g., towels, premium products)';
COMMENT ON TABLE booking_addons IS 'Tracks which add-ons were selected for each booking';
COMMENT ON COLUMN service_addons.name IS 'Name of the add-on (e.g., "Fresh Towel", "Premium Shampoo")';
COMMENT ON COLUMN service_addons.price IS 'Price of the add-on in dollars';
COMMENT ON COLUMN service_addons.is_active IS 'Whether the add-on is currently available for selection';
COMMENT ON COLUMN booking_addons.price IS 'Price of the add-on at the time of booking (for price history)';
COMMENT ON COLUMN bookings.addon_total IS 'Total cost of all add-ons for this booking';

-- Create function to update booking addon_total when addons are added/removed
CREATE OR REPLACE FUNCTION update_booking_addon_total()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE bookings 
        SET addon_total = addon_total + NEW.price
        WHERE id = NEW.booking_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE bookings 
        SET addon_total = addon_total - OLD.price
        WHERE id = OLD.booking_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE bookings 
        SET addon_total = addon_total - OLD.price + NEW.price
        WHERE id = NEW.booking_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update booking addon_total
CREATE TRIGGER update_booking_addon_total_trigger
    AFTER INSERT OR UPDATE OR DELETE ON booking_addons
    FOR EACH ROW
    EXECUTE FUNCTION update_booking_addon_total(); 