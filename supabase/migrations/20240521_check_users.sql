-- Check auth.users table
SELECT 
    id,
    email,
    raw_user_meta_data,
    created_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Check profiles table
SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 5; 