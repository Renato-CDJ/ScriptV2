-- Enable Row Level Security on all tables
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

-- Products policies (read-only for operators, full access for admins)
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
