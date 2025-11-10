-- Create default admin user
-- Note: This creates the profile row. The actual auth.users entry must be created via Supabase Auth signup
INSERT INTO public.users (id, username, role, permissions)
VALUES (
  '00000000-0000-0000-0000-000000000001'::UUID,
  'admin',
  'admin',
  '{}'::JSONB
)
ON CONFLICT (username) DO NOTHING;
