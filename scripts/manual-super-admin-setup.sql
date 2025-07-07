-- Manual Super Admin Setup Script
-- Run this in your Supabase SQL Editor if the Node.js script fails

-- Step 1: Create the super admin user in auth.users
-- Note: This needs to be done through the Supabase Auth UI or API
-- Go to Authentication > Users in your Supabase dashboard
-- Add user manually with:
-- Email: primbocm@gmail.com
-- Password: Yasaddybocm123!

-- Step 2: Get the user ID (replace with actual UUID from auth.users)
-- You can find this in Authentication > Users after creating the user
-- Or run: SELECT id FROM auth.users WHERE email = 'primbocm@gmail.com';

-- Step 3: Create the profile (replace USER_ID_HERE with actual UUID)
INSERT INTO public.profiles (
    id,
    name,
    email,
    role,
    email_notifications,
    sms_notifications,
    marketing_emails,
    is_public
) VALUES (
    'USER_ID_HERE', -- Replace with actual user ID from auth.users
    'Super Admin',
    'primbocm@gmail.com',
    'admin',
    true,
    true,
    false,
    false
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role;

-- Step 4: Verify the profile was created
SELECT * FROM public.profiles WHERE email = 'primbocm@gmail.com';

-- Step 5: Test the super admin login
-- Go to your app and try logging in with:
-- Email: primbocm@gmail.com
-- Password: Yasaddybocm123! 