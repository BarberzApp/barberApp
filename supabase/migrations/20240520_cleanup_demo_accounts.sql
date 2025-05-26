-- Delete demo accounts from profiles table
DELETE FROM profiles 
WHERE email LIKE '%@example.com' 
   OR email LIKE '%@demo.com'
   OR email LIKE '%@test.com'
   OR name LIKE 'Demo%'
   OR name LIKE 'Test%';

-- Delete corresponding auth users
DELETE FROM auth.users 
WHERE email LIKE '%@example.com' 
   OR email LIKE '%@demo.com'
   OR email LIKE '%@test.com'
   OR raw_user_meta_data->>'name' LIKE 'Demo%'
   OR raw_user_meta_data->>'name' LIKE 'Test%'; 