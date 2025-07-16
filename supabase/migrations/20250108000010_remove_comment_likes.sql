-- Migration: Remove comment likes functionality
-- This migration removes comment likes from the analytics system

-- Step 1: Remove any existing comment analytics data
DELETE FROM public.cut_analytics WHERE action_type = 'comment';

-- Step 2: Update the action_type constraint to remove 'comment'
-- First, drop the existing constraint
ALTER TABLE public.cut_analytics DROP CONSTRAINT IF EXISTS reel_analytics_unique_action;
ALTER TABLE public.cut_analytics DROP CONSTRAINT IF EXISTS cut_analytics_unique_action;

-- Step 3: Update the action_type column to remove 'comment' from the check constraint
ALTER TABLE public.cut_analytics DROP CONSTRAINT IF EXISTS reel_analytics_action_type_check;

-- Step 4: Add new constraint without 'comment'
ALTER TABLE public.cut_analytics 
ADD CONSTRAINT cut_analytics_action_type_check 
CHECK (action_type IN ('view', 'like', 'share'));

-- Step 5: Re-add the unique constraint
ALTER TABLE public.cut_analytics 
ADD CONSTRAINT cut_analytics_unique_action 
UNIQUE (cut_id, user_id, action_type);

-- Step 6: Update the comment in the documentation
COMMENT ON COLUMN public.cut_analytics.action_type IS 'Type of user action (view, like, share)';