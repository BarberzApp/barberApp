-- Fix the update_reel_stats function to work with cuts table instead of reels table

-- Drop the old triggers first (before dropping functions)
DROP TRIGGER IF EXISTS trigger_update_reel_stats ON cut_analytics;
DROP TRIGGER IF EXISTS trigger_update_reel_comments_count ON cut_comments;

-- Drop the old functions
DROP FUNCTION IF EXISTS update_reel_stats() CASCADE;
DROP FUNCTION IF EXISTS update_reel_comments_count() CASCADE;

-- Create the new function that works with cuts table
CREATE OR REPLACE FUNCTION update_cut_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update views count
    UPDATE cuts 
    SET views = (
        SELECT COUNT(*) 
        FROM cut_analytics 
        WHERE cut_id = NEW.cut_id AND action_type = 'view'
    )
    WHERE id = NEW.cut_id;
    
    -- Update likes count
    UPDATE cuts 
    SET likes = (
        SELECT COUNT(*) 
        FROM cut_analytics 
        WHERE cut_id = NEW.cut_id AND action_type = 'like'
    )
    WHERE id = NEW.cut_id;
    
    -- Update shares count
    UPDATE cuts 
    SET shares = (
        SELECT COUNT(*) 
        FROM cut_analytics 
        WHERE cut_id = NEW.cut_id AND action_type = 'share'
    )
    WHERE id = NEW.cut_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the new trigger
CREATE TRIGGER trigger_update_cut_stats
    AFTER INSERT OR DELETE ON cut_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_cut_stats();

-- Create the new comments count function
CREATE OR REPLACE FUNCTION update_cut_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE cuts 
        SET comments_count = comments_count + 1
        WHERE id = NEW.cut_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE cuts 
        SET comments_count = comments_count - 1
        WHERE id = OLD.cut_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the new comments trigger
CREATE TRIGGER trigger_update_cut_comments_count
    AFTER INSERT OR DELETE ON cut_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_cut_comments_count();

-- Add comments for documentation
COMMENT ON FUNCTION update_cut_stats() IS 'Updates cut statistics (views, likes, shares) from analytics data';
COMMENT ON FUNCTION update_cut_comments_count() IS 'Updates cut comments count when comments are added or removed'; 