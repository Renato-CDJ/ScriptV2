-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('operator', 'admin')),
  is_online BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Login sessions table
CREATE TABLE IF NOT EXISTS public.login_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  login_at TIMESTAMPTZ DEFAULT NOW(),
  logout_at TIMESTAMPTZ,
  duration BIGINT, -- in milliseconds
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  script_id UUID, -- Will reference first step
  category TEXT NOT NULL CHECK (category IN ('habitacional', 'comercial', 'outros')),
  is_active BOOLEAN DEFAULT true,
  attendance_types TEXT[] DEFAULT '{}', -- Array of 'ativo' or 'receptivo'
  person_types TEXT[] DEFAULT '{}', -- Array of 'fisica' or 'juridica'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Script steps table
CREATE TABLE IF NOT EXISTS public.script_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  formatting JSONB DEFAULT '{}', -- Store text formatting options
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Script buttons table
CREATE TABLE IF NOT EXISTS public.script_buttons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  step_id UUID NOT NULL REFERENCES public.script_steps(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  next_step_id UUID REFERENCES public.script_steps(id) ON DELETE SET NULL,
  variant TEXT DEFAULT 'default' CHECK (variant IN ('default', 'primary', 'secondary', 'destructive')),
  button_order INTEGER NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabulations table
CREATE TABLE IF NOT EXISTS public.tabulations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step tabulations junction table (many-to-many)
CREATE TABLE IF NOT EXISTS public.step_tabulations (
  step_id UUID NOT NULL REFERENCES public.script_steps(id) ON DELETE CASCADE,
  tabulation_id UUID NOT NULL REFERENCES public.tabulations(id) ON DELETE CASCADE,
  PRIMARY KEY (step_id, tabulation_id)
);

-- Service situations table
CREATE TABLE IF NOT EXISTS public.service_situations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  expanded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Channels table
CREATE TABLE IF NOT EXISTS public.channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notes table
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Call sessions table
CREATE TABLE IF NOT EXISTS public.call_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  current_step_id UUID REFERENCES public.script_steps(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  tabulation_id UUID REFERENCES public.tabulations(id) ON DELETE SET NULL,
  situation_id UUID REFERENCES public.service_situations(id) ON DELETE SET NULL,
  channel_id UUID REFERENCES public.channels(id) ON DELETE SET NULL,
  notes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_login_sessions_user_id ON public.login_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_script_steps_product_id ON public.script_steps(product_id);
CREATE INDEX IF NOT EXISTS idx_script_buttons_step_id ON public.script_buttons(step_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_operator_id ON public.call_sessions(operator_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_script_steps_updated_at BEFORE UPDATE ON public.script_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tabulations_updated_at BEFORE UPDATE ON public.tabulations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_situations_updated_at BEFORE UPDATE ON public.service_situations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON public.channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
