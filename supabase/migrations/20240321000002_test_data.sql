-- Insert test users with proper metadata and email verification
INSERT INTO auth.users (id, email, raw_user_meta_data, email_confirmed_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'client@example.com', 
     jsonb_build_object(
        'name', 'Test Client',
        'role', 'client',
        'phone', '+1234567890',
        'location', 'New York, NY'
     ),
     NOW()),
    ('22222222-2222-2222-2222-222222222222', 'barber@example.com', 
     jsonb_build_object(
        'name', 'Test Barber',
        'role', 'barber',
        'phone', '+1987654321',
        'location', 'Los Angeles, CA'
     ),
     NOW());

-- Update profiles with additional data
UPDATE profiles
SET 
    phone = '+1234567890',
    location = 'New York, NY',
    bio = 'Regular client looking for great haircuts',
    favorites = ARRAY[]::uuid[],
    created_at = NOW(),
    updated_at = NOW()
WHERE id = '11111111-1111-1111-1111-111111111111';

UPDATE profiles
SET 
    phone = '+1987654321',
    location = 'Los Angeles, CA',
    bio = 'Professional barber with 5 years of experience',
    favorites = ARRAY[]::uuid[],
    created_at = NOW(),
    updated_at = NOW()
WHERE id = '22222222-2222-2222-2222-222222222222';

-- Insert test barber
INSERT INTO barbers (id, user_id, bio, specialties, price_range)
VALUES
  ('b1', 'u1', 'Professional barber with 10 years of experience', ARRAY['Fade', 'Beard Trim'], '$20-$50'),
  ('b2', 'u2', 'Specializing in modern cuts and styles', ARRAY['Pompadour', 'Undercut'], '$25-$60'),
  ('b3', 'u3', 'Classic cuts and traditional styles', ARRAY['Classic Cut', 'Hot Towel Shave'], '$30-$70')
ON CONFLICT (id) DO UPDATE SET
  bio = EXCLUDED.bio,
  specialties = EXCLUDED.specialties,
  price_range = EXCLUDED.price_range;

-- Insert test services
INSERT INTO services (id, name, description, duration, price, barber_id)
VALUES 
    ('44444444-4444-4444-4444-444444444444', 'Haircut', 'Basic haircut service', 30, 25.00, '33333333-3333-3333-3333-333333333333'),
    ('55555555-5555-5555-5555-555555555555', 'Beard Trim', 'Professional beard trimming', 20, 15.00, '33333333-3333-3333-3333-333333333333'),
    ('66666666-6666-6666-6666-666666666666', 'Fade', 'Classic fade haircut', 45, 35.00, '33333333-3333-3333-3333-333333333333')
ON CONFLICT (barber_id, name) DO UPDATE
SET
    description = EXCLUDED.description,
    duration = EXCLUDED.duration,
    price = EXCLUDED.price;

-- Insert test availability
INSERT INTO availability (id, barber_id, day_of_week, start_time, end_time)
VALUES 
    ('77777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333', 1, '09:00:00', '17:00:00'),
    ('88888888-8888-8888-8888-888888888888', '33333333-3333-3333-3333-333333333333', 2, '09:00:00', '17:00:00'),
    ('99999999-9999-9999-9999-999999999999', '33333333-3333-3333-3333-333333333333', 3, '09:00:00', '17:00:00'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 4, '09:00:00', '17:00:00'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 5, '09:00:00', '17:00:00')
ON CONFLICT (barber_id, day_of_week) DO UPDATE
SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time;

-- Insert test bookings
INSERT INTO bookings (id, barber_id, client_id, service_id, date, status, price)
VALUES 
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', NOW() + interval '1 day', 'confirmed', 25.00),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', NOW() + interval '2 days', 'pending', 15.00)
ON CONFLICT (barber_id, client_id, date) DO UPDATE
SET
    status = EXCLUDED.status,
    price = EXCLUDED.price; 