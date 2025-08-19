-- Fix the review trigger that isn't working properly
-- Drop and recreate the trigger function and trigger

-- Drop existing trigger first
DROP TRIGGER IF EXISTS trigger_update_barber_review_stats ON reviews;

-- Drop existing function
DROP FUNCTION IF EXISTS update_barber_review_stats();

-- Recreate the function with better error handling
CREATE OR REPLACE FUNCTION update_barber_review_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT operations
    IF TG_OP = 'INSERT' THEN
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
                SELECT COALESCE(AVG(rating)::DECIMAL(3,2), 0.00)
                FROM reviews 
                WHERE barber_id = NEW.barber_id 
                AND is_public = true 
                AND is_moderated = true
            )
        WHERE id = NEW.barber_id;
        RETURN NEW;
    
    -- Handle UPDATE operations
    ELSIF TG_OP = 'UPDATE' THEN
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
                SELECT COALESCE(AVG(rating)::DECIMAL(3,2), 0.00)
                FROM reviews 
                WHERE barber_id = NEW.barber_id 
                AND is_public = true 
                AND is_moderated = true
            )
        WHERE id = NEW.barber_id;
        RETURN NEW;
    
    -- Handle DELETE operations
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE barbers 
        SET 
            review_count = (
                SELECT COUNT(*)
                FROM reviews 
                WHERE barber_id = OLD.barber_id 
                AND is_public = true 
                AND is_moderated = true
            ),
            average_rating = (
                SELECT COALESCE(AVG(rating)::DECIMAL(3,2), 0.00)
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

-- Recreate the trigger
CREATE TRIGGER trigger_update_barber_review_stats
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_barber_review_stats();

-- Update all existing barber stats to be correct
UPDATE barbers 
SET 
    review_count = (
        SELECT COUNT(*)
        FROM reviews 
        WHERE barber_id = barbers.id 
        AND is_public = true 
        AND is_moderated = true
    ),
    average_rating = (
        SELECT COALESCE(AVG(rating)::DECIMAL(3,2), 0.00)
        FROM reviews 
        WHERE barber_id = barbers.id 
        AND is_public = true 
        AND is_moderated = true
    ); 