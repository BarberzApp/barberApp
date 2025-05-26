-- Check if trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
AND trigger_schema = 'auth';

-- Check function permissions
SELECT 
    proname as function_name,
    proowner::regrole as owner,
    pronargs as num_args,
    prorettype::regtype as return_type
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Check if we have the right permissions
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'profiles';

-- Check if the profiles table exists and has the right structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position; 