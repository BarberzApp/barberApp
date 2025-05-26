-- Update auth settings for local development
UPDATE auth.config
SET site_url = 'http://localhost:3001',
    additional_redirect_urls = ARRAY['http://localhost:3001/auth/callback'],
    mailer_autoconfirm = true,
    enable_signup = true;

-- Enable email confirmations for specific domains only
UPDATE auth.config
SET mailer_secure_email_change_enabled = true,
    mailer_otp_exp = 3600,
    mailer_allowlist_enabled = true,
    mailer_allowlist_domains = ARRAY['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'example.com'];

-- Grant necessary permissions for local development
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Ensure the trigger function has the right permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role; 