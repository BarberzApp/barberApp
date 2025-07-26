-- Migration: Fix cut_analytics permissions for client access
-- This migration ensures clients can properly query and manage their own analytics

-- First, disable RLS to clean up
ALTER TABLE public.cut_analytics DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Analytics are viewable by reel owner" ON public.cut_analytics;
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.cut_analytics;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.cut_analytics;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.cut_analytics;
DROP POLICY IF EXISTS "cut_analytics_select_policy" ON public.cut_analytics;
DROP POLICY IF EXISTS "cut_analytics_insert_policy" ON public.cut_analytics;
DROP POLICY IF EXISTS "cut_analytics_delete_policy" ON public.cut_analytics;
DROP POLICY IF EXISTS "cut_analytics_select_all" ON public.cut_analytics;
DROP POLICY IF EXISTS "cut_analytics_insert_authenticated" ON public.cut_analytics;
DROP POLICY IF EXISTS "cut_analytics_delete_own" ON public.cut_analytics;
DROP POLICY IF EXISTS "cut_analytics_update_own" ON public.cut_analytics;

-- Grant full permissions
GRANT ALL ON public.cut_analytics TO authenticated;
GRANT ALL ON public.cut_analytics TO anon;

-- Re-enable RLS
ALTER TABLE public.cut_analytics ENABLE ROW LEVEL SECURITY;

-- Create new comprehensive policies
-- Allow anyone to view analytics (needed for checking like status)
CREATE POLICY "cut_analytics_select_all" ON public.cut_analytics
    FOR SELECT USING (true);

-- Allow authenticated users to insert analytics
CREATE POLICY "cut_analytics_insert_authenticated" ON public.cut_analytics
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to delete their own analytics (for unlike functionality)
CREATE POLICY "cut_analytics_delete_own" ON public.cut_analytics
    FOR DELETE USING (auth.uid() = user_id);

-- Allow users to update their own analytics (if needed)
CREATE POLICY "cut_analytics_update_own" ON public.cut_analytics
    FOR UPDATE USING (auth.uid() = user_id); 