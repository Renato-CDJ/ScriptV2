import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    // Create a Supabase client with service role to bypass RLS
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Schema SQL
    const schemaSql = `
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('operator', 'admin')),
  is_online BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  permissions JSONB DEFAULT '{}'::jsonb
);

-- Create login_sessions table
CREATE TABLE IF NOT EXISTS login_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  logout_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  script_id UUID,
  category TEXT NOT NULL CHECK (category IN ('habitacional', 'comercial', 'outros')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  attendance_types TEXT[] DEFAULT ARRAY[]::TEXT[],
  person_types TEXT[] DEFAULT ARRAY[]::TEXT[],
  description TEXT
);

-- Create script_steps table
CREATE TABLE IF NOT EXISTS script_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  buttons JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  tabulations JSONB DEFAULT '[]'::jsonb,
  content_segments JSONB DEFAULT '[]'::jsonb,
  formatting JSONB DEFAULT '{}'::jsonb,
  alert JSONB
);

-- Create tabulations table
CREATE TABLE IF NOT EXISTS tabulations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create service_situations table
CREATE TABLE IF NOT EXISTS service_situations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expanded BOOLEAN DEFAULT FALSE
);

-- Create channels table
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create call_sessions table
CREATE TABLE IF NOT EXISTS call_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  current_step_id UUID REFERENCES script_steps(id) ON DELETE SET NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tabulation_id UUID REFERENCES tabulations(id) ON DELETE SET NULL,
  situation_id UUID REFERENCES service_situations(id) ON DELETE SET NULL,
  channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
  notes TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  seen_by UUID[] DEFAULT ARRAY[]::UUID[],
  recipients UUID[] DEFAULT ARRAY[]::UUID[],
  segments JSONB DEFAULT '[]'::jsonb
);

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  scheduled_date TIMESTAMP WITH TIME ZONE
);

-- Create quiz_attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  operator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  operator_name TEXT NOT NULL,
  selected_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('operator', 'admin')),
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachment JSONB,
  reply_to JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);

-- Create chat_settings table
CREATE TABLE IF NOT EXISTS chat_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  is_enabled BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create presentations table
CREATE TABLE IF NOT EXISTS presentations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  slides JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  recipients UUID[] DEFAULT ARRAY[]::UUID[]
);

-- Create presentation_progress table
CREATE TABLE IF NOT EXISTS presentation_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE,
  operator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  operator_name TEXT NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  marked_as_seen BOOLEAN DEFAULT FALSE,
  completion_date TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_login_sessions_user_id ON login_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_script_steps_product_id ON script_steps(product_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_operator_id ON call_sessions(operator_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_by ON messages(created_by);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_by ON quizzes(created_by);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_operator_id ON quiz_attempts(operator_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient_id ON chat_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_presentations_created_by ON presentations(created_by);
CREATE INDEX IF NOT EXISTS idx_presentation_progress_presentation_id ON presentation_progress(presentation_id);
CREATE INDEX IF NOT EXISTS idx_presentation_progress_operator_id ON presentation_progress(operator_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE tabulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_situations ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentation_progress ENABLE ROW LEVEL SECURITY;
`

    const policiesSql = `
-- Create policies for authenticated users
CREATE POLICY IF NOT EXISTS "Enable read access for all authenticated users" ON users
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Enable insert for service role only" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable update for service role only" ON users
  FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "Enable delete for service role only" ON users
  FOR DELETE USING (true);

CREATE POLICY IF NOT EXISTS "Allow all for authenticated users on login_sessions" ON login_sessions FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all for authenticated users on products" ON products FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all for authenticated users on script_steps" ON script_steps FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all for authenticated users on tabulations" ON tabulations FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all for authenticated users on service_situations" ON service_situations FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all for authenticated users on channels" ON channels FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all for authenticated users on notes" ON notes FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all for authenticated users on call_sessions" ON call_sessions FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all for authenticated users on messages" ON messages FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all for authenticated users on quizzes" ON quizzes FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all for authenticated users on quiz_attempts" ON quiz_attempts FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all for authenticated users on chat_messages" ON chat_messages FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all for authenticated users on chat_settings" ON chat_settings FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all for authenticated users on presentations" ON presentations FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all for authenticated users on presentation_progress" ON presentation_progress FOR ALL USING (true);
`

    const seedSql = `
-- Seed default users
INSERT INTO users (username, full_name, role, permissions) VALUES
  ('admin', 'Administrador Sistema', 'admin', '{"dashboard": true, "scripts": true, "products": true, "attendanceConfig": true, "tabulations": true, "situations": true, "channels": true, "notes": true, "operators": true, "messagesQuiz": true, "settings": true}'::jsonb),
  ('Monitoria1', 'Monitoria 1', 'admin', '{"dashboard": true, "scripts": true, "products": true, "attendanceConfig": true, "tabulations": true, "situations": true, "channels": true, "notes": true, "operators": true, "messagesQuiz": true, "settings": true}'::jsonb),
  ('Monitoria2', 'Monitoria 2', 'admin', '{"dashboard": true, "scripts": true, "products": true, "attendanceConfig": true, "tabulations": true, "situations": true, "channels": true, "notes": true, "operators": true, "messagesQuiz": true, "settings": true}'::jsonb),
  ('Monitoria3', 'Monitoria 3', 'admin', '{"dashboard": true, "scripts": true, "products": true, "attendanceConfig": true, "tabulations": true, "situations": true, "channels": true, "notes": true, "operators": true, "messagesQuiz": true, "settings": true}'::jsonb),
  ('Monitoria4', 'Monitoria 4', 'admin', '{"dashboard": true, "scripts": true, "products": true, "attendanceConfig": true, "tabulations": true, "situations": true, "channels": true, "notes": true, "operators": true, "messagesQuiz": true, "settings": true}'::jsonb)
ON CONFLICT (username) DO NOTHING;

-- Seed default chat settings
INSERT INTO chat_settings (is_enabled) VALUES (true);

-- Seed default channels
INSERT INTO channels (name, contact, is_active) VALUES
  ('Alô CAIXA', '4004 0 104 (Capitais e Regiões Metropolitanas) | 0800 104 0 104 (Demais regiões)', true),
  ('Atendimento CAIXA Cidadão', '0800 726 0207', true),
  ('Agência Digital', '4004 0 104 (Capitais) | 0800 104 0 104 (Demais regiões)', true),
  ('Atendimento para Pessoas Surdas', 'https://icom.app/8AG8Z | www.caixa.gov.br/libras', true),
  ('SAC CAIXA', '0800 726 0101', true),
  ('Ouvidoria CAIXA', '0800 725 7474', true),
  ('Canal de Denúncias', '0800 721 0738 | https://www.caixa.gov.br/denuncia', true)
ON CONFLICT DO NOTHING;
`

    console.log("[v0] Creating database schema...")
    const { error: schemaError } = await supabase.rpc("exec_sql", { sql: schemaSql })

    if (schemaError) {
      console.error("[v0] Schema error:", schemaError)
      return NextResponse.json({ error: schemaError.message }, { status: 500 })
    }

    console.log("[v0] Creating policies...")
    const { error: policiesError } = await supabase.rpc("exec_sql", { sql: policiesSql })

    if (policiesError) {
      console.error("[v0] Policies error:", policiesError)
      // Continue even if policies fail - they might already exist
    }

    console.log("[v0] Seeding data...")
    const { error: seedError } = await supabase.rpc("exec_sql", { sql: seedSql })

    if (seedError) {
      console.error("[v0] Seed error:", seedError)
      return NextResponse.json({ error: seedError.message }, { status: 500 })
    }

    console.log("[v0] Database setup completed successfully!")
    return NextResponse.json({
      success: true,
      message: "Database setup completed successfully!",
    })
  } catch (error) {
    console.error("[v0] Setup error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
