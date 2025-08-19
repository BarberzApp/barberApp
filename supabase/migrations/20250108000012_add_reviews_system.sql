-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    is_verified BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    is_moderated BOOLEAN DEFAULT false,
    moderator_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    CONSTRAINT reviews_booking_unique UNIQUE (booking_id),
    CONSTRAINT reviews_client_barber_unique UNIQUE (client_id, barber_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_barber_id ON reviews(barber_id);
CREATE INDEX IF NOT EXISTS idx_reviews_client_id ON reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews
CREATE POLICY "Reviews are viewable by everyone if public"
    ON reviews FOR SELECT
    USING (is_public = true AND is_moderated = true);

CREATE POLICY "Users can view their own reviews"
    ON reviews FOR SELECT
    USING (auth.uid() = client_id OR auth.uid() = (
        SELECT user_id FROM barbers WHERE id = barber_id
    ));

CREATE POLICY "Clients can insert reviews for their completed bookings"
    ON reviews FOR INSERT
    WITH CHECK (
        auth.uid() = client_id AND
        EXISTS (
            SELECT 1 FROM bookings 
            WHERE id = booking_id 
            AND client_id = auth.uid() 
            AND status = 'completed'
        )
    );

CREATE POLICY "Users can update their own reviews"
    ON reviews FOR UPDATE
    USING (auth.uid() = client_id);

CREATE POLICY "Users can delete their own reviews"
    ON reviews FOR DELETE
    USING (auth.uid() = client_id);

-- Add review count and average rating to barbers table
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00;

-- Function to update barber review stats
CREATE OR REPLACE FUNCTION update_barber_review_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE barbers 
        SET 
            review_count = review_count + 1,
            average_rating = (
                SELECT AVG(rating)::DECIMAL(3,2)
                FROM reviews 
                WHERE barber_id = NEW.barber_id 
                AND is_public = true 
                AND is_moderated = true
            )
        WHERE id = NEW.barber_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Recalculate stats for the barber
        UPDATE barbers 
        SET 
            review_count = (
                SELECT COUNT(*)
                FROM reviews 
                WHERE barber_id = NEW.barber_id 
                AND is_public = true 
                AND is_moderated = true
            ),
            average_rating = (
                SELECT AVG(rating)::DECIMAL(3,2)
                FROM reviews 
                WHERE barber_id = NEW.barber_id 
                AND is_public = true 
                AND is_moderated = true
            )
        WHERE id = NEW.barber_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE barbers 
        SET 
            review_count = review_count - 1,
            average_rating = (
                SELECT AVG(rating)::DECIMAL(3,2)
                FROM reviews 
                WHERE barber_id = OLD.barber_id 
                AND is_public = true 
                AND is_moderated = true
            )
        WHERE id = OLD.barber_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for review stats
CREATE TRIGGER trigger_update_barber_review_stats
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_barber_review_stats();

-- Add review_requested field to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS review_requested BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS review_requested_at TIMESTAMP WITH TIME ZONE;

-- Function to request review after completed booking
CREATE OR REPLACE FUNCTION request_review_for_booking()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE bookings 
        SET 
            review_requested = true,
            review_requested_at = NOW()
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for review requests
CREATE TRIGGER trigger_request_review
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION request_review_for_booking(); 