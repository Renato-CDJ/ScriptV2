-- =====================================================
-- CALLCENTER SCRIPT SYSTEM - DATABASE SCHEMA
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('operator', 'admin')),
  is_online BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  last_heartbeat TIMESTAMPTZ,
  last_script_access TIMESTAMPTZ,
  current_product_name TEXT,
  permissions JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- 2. LOGIN SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS login_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  login_at TIMESTAMPTZ DEFAULT NOW(),
  logout_at TIMESTAMPTZ,
  duration INTEGER -- in milliseconds
);

-- =====================================================
-- 3. PRODUCTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  script_id TEXT,
  category TEXT CHECK (category IN ('habitacional', 'comercial', 'cartao', 'outros')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  attendance_types TEXT[] DEFAULT ARRAY['ativo', 'receptivo'],
  person_types TEXT[] DEFAULT ARRAY['fisica', 'juridica'],
  description TEXT
);

-- =====================================================
-- 4. SCRIPT STEPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS script_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  buttons JSONB DEFAULT '[]'::jsonb,
  tabulations JSONB DEFAULT '[]'::jsonb,
  content_segments JSONB DEFAULT '[]'::jsonb,
  formatting JSONB DEFAULT '{}'::jsonb,
  alert JSONB
);

-- =====================================================
-- 5. TABULATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tabulations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. SERVICE SITUATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS service_situations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. CHANNELS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. NOTES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 9. MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  seen_by TEXT[] DEFAULT ARRAY[]::TEXT[],
  recipients TEXT[] DEFAULT ARRAY[]::TEXT[],
  segments JSONB DEFAULT '[]'::jsonb
);

-- =====================================================
-- 10. QUIZZES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  scheduled_date TIMESTAMPTZ,
  recipients TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- =====================================================
-- 11. QUIZ ATTEMPTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  operator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  operator_name TEXT NOT NULL,
  selected_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 12. CHAT MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('operator', 'admin')),
  recipient_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  attachment JSONB,
  reply_to JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT false
);

-- =====================================================
-- 13. CHAT SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  is_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- =====================================================
-- 14. PRESENTATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS presentations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  slides JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES users(id),
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  recipients TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- =====================================================
-- 15. PRESENTATION PROGRESS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS presentation_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE,
  operator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  operator_name TEXT NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  marked_as_seen BOOLEAN DEFAULT false,
  completion_date TIMESTAMPTZ
);

-- =====================================================
-- 16. QUALITY QUESTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS quality_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  operator_name TEXT NOT NULL,
  question TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  answer TEXT,
  answered_by UUID REFERENCES users(id),
  answered_by_name TEXT,
  answered_at TIMESTAMPTZ,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  was_clear BOOLEAN,
  reopen_reason TEXT,
  reopened_at TIMESTAMPTZ,
  previous_answers JSONB DEFAULT '[]'::jsonb
);

-- =====================================================
-- 17. FEEDBACKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  operator_name TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  call_date TIMESTAMPTZ NOT NULL,
  ec_number TEXT NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('positive', 'negative')),
  severity TEXT NOT NULL CHECK (severity IN ('elogio', 'leve', 'medio', 'grave')),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  details TEXT NOT NULL,
  positive_points TEXT,
  improvement_points TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- =====================================================
-- 18. RESULT CODES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS result_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  phase TEXT NOT NULL CHECK (phase IN ('before', 'after')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- =====================================================
-- 19. QUALITY POSTS TABLE (Social Feed)
-- =====================================================
CREATE TABLE IF NOT EXISTS quality_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_type TEXT NOT NULL CHECK (post_type IN ('comunicado', 'quiz', 'recado', 'pergunta')),
  content TEXT NOT NULL,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  quiz_options JSONB DEFAULT '[]'::jsonb,
  likes TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_question_to_admin BOOLEAN DEFAULT false
);

-- =====================================================
-- 20. QUALITY COMMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS quality_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES quality_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 21. CONTRACTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- =====================================================
-- 22. SUPERVISOR TEAMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS supervisor_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supervisor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  operator_ids TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- =====================================================
-- CREATE INDEXES FOR BETTER PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_login_sessions_user_id ON login_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_script_steps_product_id ON script_steps(product_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_at ON quizzes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_operator_id ON quiz_attempts(operator_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient_id ON chat_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_operator_id ON feedbacks(operator_id);
CREATE INDEX IF NOT EXISTS idx_quality_posts_created_at ON quality_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quality_comments_post_id ON quality_comments(post_id);

-- =====================================================
-- INSERT DEFAULT ADMIN USER
-- =====================================================
INSERT INTO users (username, password, full_name, role, permissions)
VALUES ('admin', 'admin123', 'Administrador', 'admin', '{"dashboard": true, "scripts": true, "products": true, "attendanceConfig": true, "tabulations": true, "situations": true, "channels": true, "notes": true, "operators": true, "messagesQuiz": true, "chat": true, "settings": true}')
ON CONFLICT (username) DO NOTHING;

-- =====================================================
-- INSERT DEFAULT CHAT SETTINGS
-- =====================================================
INSERT INTO chat_settings (is_enabled)
VALUES (true)
ON CONFLICT DO NOTHING;
