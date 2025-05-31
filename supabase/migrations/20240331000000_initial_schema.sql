-- Drop existing tables in correct order (handling dependencies)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS job_applications CASCADE;
DROP TABLE IF EXISTS job_postings CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS time_off CASCADE;
DROP TABLE IF EXISTS availability CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS barbers CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables in correct order (handling dependencies)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    image_url TEXT,
    role TEXT NOT NULL,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    description TEXT,
    location TEXT,
    phone TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE barbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    specialties TEXT[],
    portfolio TEXT[],
    price_range TEXT,
    rating DECIMAL(3,2),
    total_reviews INTEGER DEFAULT 0,
    business_id UUID REFERENCES businesses(id),
    open_to_hire BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TIME NOT NULL,
    status TEXT NOT NULL,
    payment_status TEXT NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE time_off (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    all_day BOOLEAN DEFAULT false,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    category TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE job_postings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT[] NOT NULL,
    location TEXT NOT NULL,
    compensation TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES job_postings(id) ON DELETE CASCADE,
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
    cover_letter TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies

-- Users policies
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- Barbers policies
CREATE POLICY "Anyone can view barbers"
    ON barbers FOR SELECT
    USING (true);

CREATE POLICY "Barbers can update their own profile"
    ON barbers FOR UPDATE
    USING (auth.uid() = user_id);

-- Businesses policies
CREATE POLICY "Anyone can view businesses"
    ON businesses FOR SELECT
    USING (true);

CREATE POLICY "Business owners can update their business"
    ON businesses FOR UPDATE
    USING (auth.uid() = owner_id);

-- Locations policies
CREATE POLICY "Anyone can view locations"
    ON locations FOR SELECT
    USING (true);

CREATE POLICY "Business owners can manage their locations"
    ON locations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM businesses
            WHERE businesses.id = locations.business_id
            AND businesses.owner_id = auth.uid()
        )
    );

-- Services policies
CREATE POLICY "Anyone can view services"
    ON services FOR SELECT
    USING (true);

CREATE POLICY "Barbers can manage their services"
    ON services FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM barbers
            WHERE barbers.id = services.barber_id
            AND barbers.user_id = auth.uid()
        )
    );

-- Bookings policies
CREATE POLICY "Users can view their own bookings"
    ON bookings FOR SELECT
    USING (client_id = auth.uid());

CREATE POLICY "Barbers can view their bookings"
    ON bookings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM barbers
            WHERE barbers.id = bookings.barber_id
            AND barbers.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create bookings"
    ON bookings FOR INSERT
    WITH CHECK (client_id = auth.uid());

CREATE POLICY "Users can update their own bookings"
    ON bookings FOR UPDATE
    USING (client_id = auth.uid());

-- Reviews policies
CREATE POLICY "Anyone can view reviews"
    ON reviews FOR SELECT
    USING (true);

CREATE POLICY "Users can create reviews for their bookings"
    ON reviews FOR INSERT
    WITH CHECK (
        client_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = reviews.booking_id
            AND bookings.client_id = auth.uid()
        )
    );

-- Availability policies
CREATE POLICY "Anyone can view availability"
    ON availability FOR SELECT
    USING (true);

CREATE POLICY "Barbers can manage their availability"
    ON availability FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM barbers
            WHERE barbers.id = availability.barber_id
            AND barbers.user_id = auth.uid()
        )
    );

-- Time off policies
CREATE POLICY "Anyone can view time off"
    ON time_off FOR SELECT
    USING (true);

CREATE POLICY "Barbers can manage their time off"
    ON time_off FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM barbers
            WHERE barbers.id = time_off.barber_id
            AND barbers.user_id = auth.uid()
        )
    );

-- Inventory policies
CREATE POLICY "Anyone can view inventory"
    ON inventory FOR SELECT
    USING (true);

CREATE POLICY "Business owners can manage their inventory"
    ON inventory FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM businesses
            WHERE businesses.id = inventory.business_id
            AND businesses.owner_id = auth.uid()
        )
    );

-- Job postings policies
CREATE POLICY "Anyone can view job postings"
    ON job_postings FOR SELECT
    USING (true);

CREATE POLICY "Business owners can manage their job postings"
    ON job_postings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM businesses
            WHERE businesses.id = job_postings.business_id
            AND businesses.owner_id = auth.uid()
        )
    );

-- Job applications policies
CREATE POLICY "Barbers can view their applications"
    ON job_applications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM barbers
            WHERE barbers.id = job_applications.barber_id
            AND barbers.user_id = auth.uid()
        )
    );

CREATE POLICY "Business owners can view applications for their postings"
    ON job_applications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM job_postings
            JOIN businesses ON businesses.id = job_postings.business_id
            WHERE job_postings.id = job_applications.job_id
            AND businesses.owner_id = auth.uid()
        )
    );

CREATE POLICY "Barbers can create applications"
    ON job_applications FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM barbers
            WHERE barbers.id = job_applications.barber_id
            AND barbers.user_id = auth.uid()
        )
    );

-- Messages policies
CREATE POLICY "Users can view their messages"
    ON messages FOR SELECT
    USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages"
    ON messages FOR INSERT
    WITH CHECK (sender_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view their notifications"
    ON notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications"
    ON notifications FOR UPDATE
    USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_barbers_user_id ON barbers(user_id);
CREATE INDEX idx_businesses_owner_id ON businesses(owner_id);
CREATE INDEX idx_bookings_client_id ON bookings(client_id);
CREATE INDEX idx_bookings_barber_id ON bookings(barber_id);
CREATE INDEX idx_services_barber_id ON services(barber_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_reviews_barber_id ON reviews(barber_id);
CREATE INDEX idx_job_applications_barber_id ON job_applications(barber_id);
CREATE INDEX idx_job_applications_job_id ON job_applications(job_id); 