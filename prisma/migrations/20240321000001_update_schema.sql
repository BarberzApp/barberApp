-- Update profiles table
ALTER TABLE profiles
  ALTER COLUMN id TYPE uuid USING id::uuid,
  ALTER COLUMN role TYPE text USING role::text,
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('CLIENT', 'BARBER'));

-- Update notifications table
ALTER TABLE notifications
  ALTER COLUMN id TYPE uuid USING id::uuid,
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Update bookings table
ALTER TABLE bookings
  ALTER COLUMN status TYPE text USING status::text,
  ADD CONSTRAINT bookings_status_check CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW')),
  ALTER COLUMN status SET DEFAULT 'PENDING';

-- Add foreign key constraints with ON DELETE behavior
ALTER TABLE barbers
  DROP CONSTRAINT IF EXISTS barbers_user_id_fkey,
  ADD CONSTRAINT barbers_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE services
  DROP CONSTRAINT IF EXISTS services_barber_id_fkey,
  ADD CONSTRAINT services_barber_id_fkey
    FOREIGN KEY (barber_id) REFERENCES barbers(id) ON DELETE CASCADE;

ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_client_id_fkey,
  DROP CONSTRAINT IF EXISTS bookings_barber_id_fkey,
  DROP CONSTRAINT IF EXISTS bookings_service_id_fkey,
  ADD CONSTRAINT bookings_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES profiles(id) ON DELETE SET NULL,
  ADD CONSTRAINT bookings_barber_id_fkey
    FOREIGN KEY (barber_id) REFERENCES barbers(id) ON DELETE SET NULL,
  ADD CONSTRAINT bookings_service_id_fkey
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL;

ALTER TABLE availability
  DROP CONSTRAINT IF EXISTS availability_barber_id_fkey,
  ADD CONSTRAINT availability_barber_id_fkey
    FOREIGN KEY (barber_id) REFERENCES barbers(id) ON DELETE CASCADE;

ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_user_id_fkey,
  ADD CONSTRAINT notifications_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE; 