-- Fix RLS policies for cut_analytics to allow proper like/view tracking

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON cut_analytics;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON cut_analytics;
DROP POLICY IF EXISTS "Analytics are viewable by reel owner" ON cut_analytics;
DROP POLICY IF EXISTS "Anyone can insert analytics" ON cut_analytics;
DROP POLICY IF EXISTS "Analytics are viewable by everyone" ON cut_analytics;
DROP POLICY IF EXISTS "Authenticated users can insert analytics" ON cut_analytics;
DROP POLICY IF EXISTS "Users can delete their own analytics" ON cut_analytics;

-- Create proper policies for cut_analytics
-- Allow anyone to view analytics (for like status checking)
CREATE POLICY "cut_analytics_select_policy" ON cut_analytics
    FOR SELECT USING (true);

-- Allow authenticated users to insert analytics
CREATE POLICY "cut_analytics_insert_policy" ON cut_analytics
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to delete their own analytics (for unlike functionality)
CREATE POLICY "cut_analytics_delete_policy" ON cut_analytics
    FOR DELETE USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE cut_analytics ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON cut_analytics TO authenticated;
GRANT ALL ON cut_analytics TO anon; 