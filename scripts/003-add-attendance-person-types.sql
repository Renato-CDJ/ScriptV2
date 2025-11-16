-- Create attendance_types table
CREATE TABLE IF NOT EXISTS public.attendance_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create person_types table
CREATE TABLE IF NOT EXISTS public.person_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.attendance_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_types ENABLE ROW LEVEL SECURITY;

-- Create policies for attendance_types
CREATE POLICY "Allow all operations on attendance_types" ON public.attendance_types
  FOR ALL USING (true) WITH CHECK (true);

-- Create policies for person_types
CREATE POLICY "Allow all operations on person_types" ON public.person_types
  FOR ALL USING (true) WITH CHECK (true);

-- Insert default attendance types
INSERT INTO public.attendance_types (value, label) VALUES
  ('ativo', 'Ativo'),
  ('receptivo', 'Receptivo'),
  ('retencao', 'Retenção')
ON CONFLICT (value) DO NOTHING;

-- Insert default person types
INSERT INTO public.person_types (value, label) VALUES
  ('fisica', 'Física'),
  ('juridica', 'Jurídica')
ON CONFLICT (value) DO NOTHING;
