-- ============================================
-- SCRIPT COMPLETO DE CONFIGURAÇÃO DO BANCO
-- Sistema de Roteiro de Atendimento
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CRIAÇÃO DAS TABELAS
-- ============================================

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
  duration BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  script_id UUID,
  category TEXT NOT NULL CHECK (category IN ('habitacional', 'comercial', 'outros')),
  is_active BOOLEAN DEFAULT true,
  attendance_types TEXT[] DEFAULT '{}',
  person_types TEXT[] DEFAULT '{}',
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
  formatting JSONB DEFAULT '{}',
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

-- Step tabulations junction table
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

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_login_sessions_user_id ON public.login_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_script_steps_product_id ON public.script_steps(product_id);
CREATE INDEX IF NOT EXISTS idx_script_buttons_step_id ON public.script_buttons(step_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_operator_id ON public.call_sessions(operator_id);

-- ============================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- ============================================
-- HABILITAR ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.script_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.script_buttons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tabulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.step_tabulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_situations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS DE SEGURANÇA (RLS)
-- ============================================

-- Users policies
CREATE POLICY "Users can view all users" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all users" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Login sessions policies
CREATE POLICY "Users can view their own sessions" ON public.login_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON public.login_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON public.login_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions" ON public.login_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Products policies
CREATE POLICY "Everyone can view active products" ON public.products
  FOR SELECT USING (is_active = true OR EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Script steps policies
CREATE POLICY "Everyone can view script steps" ON public.script_steps
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage script steps" ON public.script_steps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Script buttons policies
CREATE POLICY "Everyone can view script buttons" ON public.script_buttons
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage script buttons" ON public.script_buttons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Tabulations policies
CREATE POLICY "Everyone can view tabulations" ON public.tabulations
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage tabulations" ON public.tabulations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Step tabulations policies
CREATE POLICY "Everyone can view step tabulations" ON public.step_tabulations
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage step tabulations" ON public.step_tabulations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service situations policies
CREATE POLICY "Everyone can view service situations" ON public.service_situations
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage service situations" ON public.service_situations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Channels policies
CREATE POLICY "Everyone can view channels" ON public.channels
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage channels" ON public.channels
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Notes policies
CREATE POLICY "Users can view their own notes" ON public.notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes" ON public.notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" ON public.notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" ON public.notes
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all notes" ON public.notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Call sessions policies
CREATE POLICY "Users can view their own call sessions" ON public.call_sessions
  FOR SELECT USING (auth.uid() = operator_id);

CREATE POLICY "Users can create their own call sessions" ON public.call_sessions
  FOR INSERT WITH CHECK (auth.uid() = operator_id);

CREATE POLICY "Users can update their own call sessions" ON public.call_sessions
  FOR UPDATE USING (auth.uid() = operator_id);

CREATE POLICY "Admins can view all call sessions" ON public.call_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
