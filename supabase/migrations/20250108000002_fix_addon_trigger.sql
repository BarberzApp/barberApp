-- Fix the addon trigger to prevent double-counting issues
-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS update_booking_addon_total_trigger ON booking_addons;
DROP FUNCTION IF EXISTS update_booking_addon_total();

-- Create a more robust function that recalculates the total instead of incrementing
CREATE OR REPLACE FUNCTION update_booking_addon_total()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate the total from scratch to prevent double-counting
    UPDATE bookings 
    SET addon_total = (
        SELECT COALESCE(SUM(price), 0)
        FROM booking_addons
        WHERE booking_id = COALESCE(NEW.booking_id, OLD.booking_id)
    )
    WHERE id = COALESCE(NEW.booking_id, OLD.booking_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER update_booking_addon_total_trigger
    AFTER INSERT OR UPDATE OR DELETE ON booking_addons
    FOR EACH ROW
    EXECUTE FUNCTION update_booking_addon_total();

-- Add a comment explaining the fix
COMMENT ON FUNCTION update_booking_addon_total() IS 'Recalculates addon_total from scratch to prevent double-counting issues';
