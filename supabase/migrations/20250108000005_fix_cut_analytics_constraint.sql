-- Migration: Fix cut_analytics constraint name
-- This migration renames the constraint to match the new table name

-- Drop the old constraint
ALTER TABLE public.cut_analytics DROP CONSTRAINT IF EXISTS reel_analytics_unique_action;

-- Add the new constraint with the correct name
ALTER TABLE public.cut_analytics 
ADD CONSTRAINT cut_analytics_unique_action 
UNIQUE (cut_id, user_id, action_type); 