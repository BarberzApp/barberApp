-- Migration: Rename reels tables to cuts
-- This migration renames all reel-related tables to cut-related tables

-- 1. Rename the main reels table to cuts
ALTER TABLE public.reels RENAME TO cuts;

-- 2. Rename reel_analytics table to cut_analytics
ALTER TABLE public.reel_analytics RENAME TO cut_analytics;

-- 3. Rename reel_comments table to cut_comments
ALTER TABLE public.reel_comments RENAME TO cut_comments;

-- 4. Update foreign key constraints in cut_analytics
ALTER TABLE public.cut_analytics 
DROP CONSTRAINT IF EXISTS reel_analytics_reel_id_fkey;

ALTER TABLE public.cut_analytics 
ADD CONSTRAINT cut_analytics_cut_id_fkey 
FOREIGN KEY (reel_id) REFERENCES public.cuts(id) ON DELETE CASCADE;

-- 5. Update foreign key constraints in cut_comments
ALTER TABLE public.cut_comments 
DROP CONSTRAINT IF EXISTS reel_comments_reel_id_fkey;

ALTER TABLE public.cut_comments 
ADD CONSTRAINT cut_comments_cut_id_fkey 
FOREIGN KEY (reel_id) REFERENCES public.cuts(id) ON DELETE CASCADE;

-- 6. Rename columns in cut_analytics from reel_id to cut_id
ALTER TABLE public.cut_analytics RENAME COLUMN reel_id TO cut_id;

-- 7. Rename columns in cut_comments from reel_id to cut_id
ALTER TABLE public.cut_comments RENAME COLUMN reel_id TO cut_id;

-- 8. Update foreign key constraints to use the new column names
ALTER TABLE public.cut_analytics 
DROP CONSTRAINT cut_analytics_cut_id_fkey;

ALTER TABLE public.cut_analytics 
ADD CONSTRAINT cut_analytics_cut_id_fkey 
FOREIGN KEY (cut_id) REFERENCES public.cuts(id) ON DELETE CASCADE;

ALTER TABLE public.cut_comments 
DROP CONSTRAINT cut_comments_cut_id_fkey;

ALTER TABLE public.cut_comments 
ADD CONSTRAINT cut_comments_cut_id_fkey 
FOREIGN KEY (cut_id) REFERENCES public.cuts(id) ON DELETE CASCADE;

-- 9. Drop and recreate RLS policies with new table names
-- Note: You may need to adjust these based on your actual policy names

-- Drop existing policies (adjust names as needed)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.cuts;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.cuts;
DROP POLICY IF EXISTS "Enable update for users based on barber_id" ON public.cuts;
DROP POLICY IF EXISTS "Enable delete for users based on barber_id" ON public.cuts;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.cut_analytics;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.cut_analytics;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.cut_comments;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.cut_comments;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.cut_comments;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.cut_comments;

-- Recreate policies for cuts table
CREATE POLICY "Enable read access for all users" ON public.cuts
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.cuts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on barber_id" ON public.cuts
    FOR UPDATE USING (auth.uid() = barber_id);

CREATE POLICY "Enable delete for users based on barber_id" ON public.cuts
    FOR DELETE USING (auth.uid() = barber_id);

-- Recreate policies for cut_analytics table
CREATE POLICY "Enable read access for all users" ON public.cut_analytics
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.cut_analytics
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Recreate policies for cut_comments table
CREATE POLICY "Enable read access for all users" ON public.cut_comments
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.cut_comments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on user_id" ON public.cut_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON public.cut_comments
    FOR DELETE USING (auth.uid() = user_id);

-- 10. Enable RLS on all tables
ALTER TABLE public.cuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cut_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cut_comments ENABLE ROW LEVEL SECURITY; 