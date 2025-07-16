-- Migration: Temporarily disable RLS on cut_analytics
-- This migration disables RLS to test if that's causing the 406 error

-- Disable RLS on cut_analytics table
ALTER TABLE public.cut_analytics DISABLE ROW LEVEL SECURITY;

-- Grant full access to both authenticated and anonymous users
GRANT ALL ON public.cut_analytics TO authenticated;
GRANT ALL ON public.cut_analytics TO anon; 