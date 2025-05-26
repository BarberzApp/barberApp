-- Drop all tables and functions
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
DROP FUNCTION IF EXISTS update_updated_at_column();

DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS businesses;
DROP TABLE IF EXISTS barbers;
DROP TABLE IF EXISTS profiles;

-- Recreate the schema
\i 20240521_initial_schema.sql 