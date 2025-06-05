-- Insert test users
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'client@example.com', '{"name": "Test Client", "role": "client"}'),
    ('22222222-2222-2222-2222-222222222222', 'barber@example.com', '{"name": "Test Barber", "role": "barber"}')
ON CONFLICT (email) DO UPDATE
SET raw_user_meta_data = EXCLUDED.raw_user_meta_data;

-- Update profiles with additional data
UPDATE profiles
SET 
    phone = '+1234567890',
    location = 'New York, NY',
    bio = 'Professional barber with 5 years of experience'
WHERE id = '22222222-2222-2222-2222-222222222222';

-- Insert test barber
INSERT INTO barbers (id, user_id, bio, specialties)
VALUES 
    ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Professional Barber', ARRAY['Haircuts', 'Beard Trimming'])
ON CONFLICT (user_id) DO UPDATE
SET
    bio = EXCLUDED.bio,
    specialties = EXCLUDED.specialties;

-- Insert test services
INSERT INTO services (id, name, description, duration, price, barber_id)
VALUES 
    ('44444444-4444-4444-4444-444444444444', 'Haircut', 'Basic haircut service', 30, 25.00, '33333333-3333-3333-3333-333333333333'),
    ('55555555-5555-5555-5555-555555555555', 'Beard Trim', 'Professional beard trimming', 20, 15.00, '33333333-3333-3333-3333-333333333333')
ON CONFLICT (id) DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    duration = EXCLUDED.duration,
    price = EXCLUDED.price;

-- Insert test availability
INSERT INTO availability (id, barber_id, day_of_week, start_time, end_time)
VALUES 
    ('66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', 1, '09:00:00', '17:00:00'),
    ('77777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333', 2, '09:00:00', '17:00:00')
ON CONFLICT (id) DO UPDATE
SET
    day_of_week = EXCLUDED.day_of_week,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time; 