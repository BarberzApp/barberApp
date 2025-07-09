-- Fix RLS policies for reel_analytics to allow proper access
DROP POLICY IF EXISTS "Analytics are viewable by reel owner" ON reel_analytics;
DROP POLICY IF EXISTS "Anyone can insert analytics" ON reel_analytics;

-- Allow anyone to view analytics (for like status checking)
CREATE POLICY "Analytics are viewable by everyone"
    ON reel_analytics FOR SELECT
    USING (true);

-- Allow authenticated users to insert analytics
CREATE POLICY "Authenticated users can insert analytics"
    ON reel_analytics FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to delete their own analytics (for unlike functionality)
CREATE POLICY "Users can delete their own analytics"
    ON reel_analytics FOR DELETE
    USING (auth.uid() = user_id); 