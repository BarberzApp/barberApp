-- Enable RLS on all tables (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Add any missing policies
-- Users can create their own profile
CREATE POLICY "Users can create their own profile"
    ON users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Barbers can create their profile
CREATE POLICY "Barbers can create their profile"
    ON barbers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can create notifications
CREATE POLICY "Users can create notifications"
    ON notifications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Add test data for local development
-- Only insert if running in development environment
DO $$
BEGIN
    IF current_setting('app.environment', true) = 'development' THEN
        -- Insert test users
        INSERT INTO users (id, email, name, role)
        VALUES 
            ('11111111-1111-1111-1111-111111111111', 'test@example.com', 'Test User', 'CLIENT'),
            ('22222222-2222-2222-2222-222222222222', 'barber@example.com', 'Test Barber', 'BARBER')
        ON CONFLICT (email) DO NOTHING;

        -- Insert test barber
        INSERT INTO barbers (id, user_id, bio, specialties)
        VALUES 
            ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Professional Barber', ARRAY['Haircuts', 'Beard Trimming'])
        ON CONFLICT (user_id) DO NOTHING;

        -- Insert test services
        INSERT INTO services (id, name, description, duration, price, barber_id)
        VALUES 
            ('44444444-4444-4444-4444-444444444444', 'Haircut', 'Basic haircut service', 30, 25.00, '33333333-3333-3333-3333-333333333333'),
            ('55555555-5555-5555-5555-555555555555', 'Beard Trim', 'Professional beard trimming', 20, 15.00, '33333333-3333-3333-3333-333333333333')
        ON CONFLICT DO NOTHING;

        -- Insert test availability
        INSERT INTO availability (id, barber_id, day_of_week, start_time, end_time)
        VALUES 
            ('66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', 1, '09:00:00', '17:00:00'),
            ('77777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333', 2, '09:00:00', '17:00:00')
        ON CONFLICT DO NOTHING;
    END IF;
END $$; 