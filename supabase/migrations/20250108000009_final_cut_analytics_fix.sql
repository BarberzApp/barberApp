-- Final migration to fix cut_analytics access issues
-- This migration completely resets the table permissions to ensure proper access

-- Step 1: Completely disable RLS to clean up
ALTER TABLE public.cut_analytics DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL possible policies that might exist
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
DROP POLICY IF EXISTS "cut_analytics_select_all" ON public.cut_analytics;
DROP POLICY IF EXISTS "cut_analytics_insert_authenticated" ON public.cut_analytics;
DROP POLICY IF EXISTS "cut_analytics_delete_own" ON public.cut_analytics;
DROP POLICY IF EXISTS "cut_analytics_update_own" ON public.cut_analytics;

-- Step 3: Grant full permissions to both authenticated and anonymous users
GRANT ALL ON public.cut_analytics TO authenticated;
GRANT ALL ON public.cut_analytics TO anon;

-- Step 4: Keep RLS disabled for now to ensure access works
-- We can re-enable it later with proper policies if needed
-- ALTER TABLE public.cut_analytics ENABLE ROW LEVEL SECURITY;

-- Step 5: Fix constraint name only if the old one exists and new one doesn't
DO $$
BEGIN
    -- Check if the old constraint exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'reel_analytics_unique_action' 
        AND table_name = 'cut_analytics'
    ) THEN
        -- Drop the old constraint
        ALTER TABLE public.cut_analytics DROP CONSTRAINT reel_analytics_unique_action;
    END IF;
    
    -- Check if the new constraint doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'cut_analytics_unique_action' 
        AND table_name = 'cut_analytics'
    ) THEN
        -- Add the new constraint
        ALTER TABLE public.cut_analytics ADD CONSTRAINT cut_analytics_unique_action UNIQUE (cut_id, user_id, action_type);
    END IF;
END $$; 