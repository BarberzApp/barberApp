-- Fix Super Admin Profile Script
-- Run this in your Supabase SQL Editor after creating the user

-- Step 1: Find the user ID (run this first)
SELECT id, email, created_at FROM auth.users WHERE email = 'primbocm@gmail.com';

-- Step 2: Create or update the profile (replace USER_ID_HERE with the actual ID from step 1)
INSERT INTO public.profiles (
    id,
    name,
    email,
    role,
    email_notifications,
    sms_notifications,
    marketing_emails,
    is_public,
    created_at,
    updated_at
) VALUES (
    '8abb3013-d77b-4030-a365-f61f3ef1a248', -- Replace with actual user ID from step 1
    'Super Admin',
    'primbocm@gmail.com',
    'admin',
    true,
    true,
    false,
    false,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = NOW();

-- Step 3: Verify the profile was created
SELECT * FROM public.profiles WHERE email = 'primbocm@gmail.com';

-- Step 4: Test the login
-- Go to your app and try logging in with:
-- Email: primbocm@gmail.com
-- Password: Yasaddybocm123! 