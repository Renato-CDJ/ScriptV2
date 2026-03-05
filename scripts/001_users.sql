-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator', 'supervisor')),
  team TEXT,
  avatar TEXT,
  is_online BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies for users
CREATE POLICY "users_select_all" ON public.users FOR SELECT USING (true);
CREATE POLICY "users_insert_admin" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (true);
CREATE POLICY "users_delete_admin" ON public.users FOR DELETE USING (true);

-- Create index
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
