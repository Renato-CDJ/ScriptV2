-- Insert admin user
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@roteiro.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Get admin user id
DO $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@roteiro.com';
  
  -- Insert admin profile
  INSERT INTO public.users (id, username, role, permissions, created_at)
  VALUES (
    admin_id,
    'admin',
    'admin',
    jsonb_build_object(
      'scripts', true,
      'products', true,
      'phraseology', true,
      'messages', true,
      'attendance_types', true,
      'operators', true,
      'access_control', true,
      'chat', true
    ),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;
END $$;

-- Insert monitoria users
DO $$
DECLARE
  i INTEGER;
  user_id UUID;
  user_email TEXT;
  user_name TEXT;
BEGIN
  FOR i IN 1..4 LOOP
    user_email := 'monitoria' || i || '@roteiro.com';
    user_name := 'monitoria' || i;
    
    -- Insert into auth.users
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      user_email,
      crypt('monitoria' || i || '123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW()
    ) ON CONFLICT (email) DO NOTHING
    RETURNING id INTO user_id;
    
    -- Get user id if already exists
    IF user_id IS NULL THEN
      SELECT id INTO user_id FROM auth.users WHERE email = user_email;
    END IF;
    
    -- Insert profile
    INSERT INTO public.users (id, username, role, permissions, created_at)
    VALUES (
      user_id,
      user_name,
      'operator',
      jsonb_build_object(
        'scripts', true,
        'products', true,
        'phraseology', true,
        'messages', true,
        'attendance_types', true,
        'operators', false,
        'access_control', false,
        'chat', true
      ),
      NOW()
    ) ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;

-- Insert some sample data
INSERT INTO public.attendance_types (name, color, icon)
VALUES 
  ('Atendimento Geral', '#3b82f6', 'Phone'),
  ('Suporte Técnico', '#10b981', 'Wrench'),
  ('Vendas', '#f59e0b', 'ShoppingCart'),
  ('Reclamação', '#ef4444', 'AlertCircle')
ON CONFLICT DO NOTHING;
