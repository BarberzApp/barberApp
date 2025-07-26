-- Fix reels table policies by dropping existing ones and recreating them
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Reels are viewable by everyone if public" ON reels;
DROP POLICY IF EXISTS "Barbers can manage own reels" ON reels;
DROP POLICY IF EXISTS "Analytics are viewable by reel owner" ON reel_analytics;
DROP POLICY IF EXISTS "Anyone can insert analytics" ON reel_analytics;

-- Recreate RLS Policies for reels
CREATE POLICY "Reels are viewable by everyone if public"
    ON reels FOR SELECT
    USING (is_public = true OR auth.uid() = (
        SELECT user_id FROM barbers WHERE barbers.id = reels.barber_id
    ));

CREATE POLICY "Barbers can manage own reels"
    ON reels FOR ALL
    USING (auth.uid() = (
        SELECT user_id FROM barbers WHERE barbers.id = reels.barber_id
    ));

-- Recreate RLS Policies for analytics
CREATE POLICY "Analytics are viewable by reel owner"
    ON reel_analytics FOR SELECT
    USING (auth.uid() = (
        SELECT user_id FROM barbers 
        WHERE barbers.id = (
            SELECT barber_id FROM reels WHERE reels.id = reel_analytics.reel_id
        )
    ));

CREATE POLICY "Anyone can insert analytics"
    ON reel_analytics FOR INSERT
    WITH CHECK (true); 