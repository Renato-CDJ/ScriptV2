-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('operator', 'admin')),
  is_online BOOLEAN DEFAULT false,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- ============================================
-- LOGIN SESSIONS TABLE
-- ============================================
CREATE TABLE login_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  login_at TIMESTAMPTZ DEFAULT NOW(),
  logout_at TIMESTAMPTZ,
  duration INTEGER, -- in milliseconds
  CONSTRAINT valid_duration CHECK (duration IS NULL OR duration >= 0)
);

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  script_id TEXT NOT NULL, -- Links to first step of script
  category TEXT NOT NULL CHECK (category IN ('habitacional', 'comercial', 'outros')),
  is_active BOOLEAN DEFAULT true,
  attendance_types TEXT[] DEFAULT ARRAY['ativo', 'receptivo'],
  person_types TEXT[] DEFAULT ARRAY['fisica', 'juridica'],
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT name_not_empty CHECK (char_length(name) > 0)
);

-- ============================================
-- SCRIPT STEPS TABLE
-- ============================================
CREATE TABLE script_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  order_num INTEGER NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  buttons JSONB DEFAULT '[]', -- Array of ScriptButton objects
  tabulations JSONB DEFAULT '[]', -- Array of tabulation references
  content_segments JSONB DEFAULT '[]', -- Array of ContentSegment objects
  formatting JSONB DEFAULT '{}', -- Text formatting options
  alert JSONB, -- Alert object with title and message
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT order_positive CHECK (order_num >= 0)
);

-- ============================================
-- TABULATIONS TABLE
-- ============================================
CREATE TABLE tabulations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6b7280',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT name_not_empty CHECK (char_length(name) > 0)
);

-- ============================================
-- SERVICE SITUATIONS TABLE
-- ============================================
CREATE TABLE service_situations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT name_not_empty CHECK (char_length(name) > 0)
);

-- ============================================
-- CHANNELS TABLE
-- ============================================
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact TEXT NOT NULL, -- Phone number or link
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT name_not_empty CHECK (char_length(name) > 0)
);

-- ============================================
-- NOTES TABLE
-- ============================================
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT content_not_empty CHECK (char_length(content) > 0)
);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  seen_by UUID[] DEFAULT ARRAY[]::UUID[],
  recipients UUID[] DEFAULT ARRAY[]::UUID[], -- Empty means all operators
  segments JSONB DEFAULT '[]', -- Array of ContentSegment objects
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT title_not_empty CHECK (char_length(title) > 0)
);

-- ============================================
-- QUIZZES TABLE
-- ============================================
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of QuizOption objects
  correct_answer TEXT NOT NULL, -- ID of correct option
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  scheduled_date TIMESTAMPTZ,
  recipients UUID[] DEFAULT ARRAY[]::UUID[], -- Empty means all operators
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT question_not_empty CHECK (char_length(question) > 0)
);

-- ============================================
-- QUIZ ATTEMPTS TABLE
-- ============================================
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operator_name TEXT NOT NULL,
  selected_answer TEXT NOT NULL, -- ID of selected option
  is_correct BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(quiz_id, operator_id) -- One attempt per operator per quiz
);

-- ============================================
-- CHAT MESSAGES TABLE
-- ============================================
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('operator', 'admin')),
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL means broadcast
  content TEXT NOT NULL,
  attachment JSONB, -- Object with type, url, name
  reply_to JSONB, -- Object with messageId, content, senderName
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT content_not_empty CHECK (char_length(content) > 0)
);

-- ============================================
-- CHAT SETTINGS TABLE
-- ============================================
CREATE TABLE chat_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  is_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- PRESENTATIONS TABLE
-- ============================================
CREATE TABLE presentations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  slides JSONB NOT NULL DEFAULT '[]', -- Array of PresentationSlide objects
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  recipients UUID[] DEFAULT ARRAY[]::UUID[], -- Empty means all operators
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT title_not_empty CHECK (char_length(title) > 0)
);

-- ============================================
-- PRESENTATION PROGRESS TABLE
-- ============================================
CREATE TABLE presentation_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  presentation_id UUID NOT NULL REFERENCES presentations(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operator_name TEXT NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  marked_as_seen BOOLEAN DEFAULT false,
  completion_date TIMESTAMPTZ,
  UNIQUE(presentation_id, operator_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_login_sessions_user_id ON login_sessions(user_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_script_steps_product_id ON script_steps(product_id);
CREATE INDEX idx_script_steps_order ON script_steps(order_num);
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_messages_created_by ON messages(created_by);
CREATE INDEX idx_messages_is_active ON messages(is_active);
CREATE INDEX idx_quizzes_created_by ON quizzes(created_by);
CREATE INDEX idx_quizzes_is_active ON quizzes(is_active);
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_operator_id ON quiz_attempts(operator_id);
CREATE INDEX idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_recipient_id ON chat_messages(recipient_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_presentations_created_by ON presentations(created_by);
CREATE INDEX idx_presentations_is_active ON presentations(is_active);
CREATE INDEX idx_presentation_progress_presentation_id ON presentation_progress(presentation_id);
CREATE INDEX idx_presentation_progress_operator_id ON presentation_progress(operator_id);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE tabulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_situations ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentation_progress ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - USERS
-- ============================================
-- Users can read all users
CREATE POLICY "Users can read all users"
  ON users FOR SELECT
  USING (true);

-- Only admins can insert/update/delete users
CREATE POLICY "Admins can manage users"
  ON users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::uuid
      AND role = 'admin'
    )
  );

-- ============================================
-- RLS POLICIES - LOGIN SESSIONS
-- ============================================
-- Users can read their own sessions
CREATE POLICY "Users can read own sessions"
  ON login_sessions FOR SELECT
  USING (user_id = auth.uid()::uuid);

-- Users can insert their own sessions
CREATE POLICY "Users can insert own sessions"
  ON login_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid()::uuid);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions"
  ON login_sessions FOR UPDATE
  USING (user_id = auth.uid()::uuid);

-- ============================================
-- RLS POLICIES - PRODUCTS
-- ============================================
-- Everyone can read active products
CREATE POLICY "Everyone can read active products"
  ON products FOR SELECT
  USING (is_active = true OR EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()::uuid
    AND role = 'admin'
  ));

-- Only admins can manage products
CREATE POLICY "Admins can manage products"
  ON products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::uuid
      AND role = 'admin'
    )
  );

-- ============================================
-- RLS POLICIES - SCRIPT STEPS
-- ============================================
-- Everyone can read script steps
CREATE POLICY "Everyone can read script steps"
  ON script_steps FOR SELECT
  USING (true);

-- Only admins can manage script steps
CREATE POLICY "Admins can manage script steps"
  ON script_steps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::uuid
      AND role = 'admin'
    )
  );

-- ============================================
-- RLS POLICIES - TABULATIONS
-- ============================================
-- Everyone can read tabulations
CREATE POLICY "Everyone can read tabulations"
  ON tabulations FOR SELECT
  USING (true);

-- Only admins can manage tabulations
CREATE POLICY "Admins can manage tabulations"
  ON tabulations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::uuid
      AND role = 'admin'
    )
  );

-- ============================================
-- RLS POLICIES - SERVICE SITUATIONS
-- ============================================
-- Everyone can read active situations
CREATE POLICY "Everyone can read active situations"
  ON service_situations FOR SELECT
  USING (is_active = true OR EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()::uuid
    AND role = 'admin'
  ));

-- Only admins can manage situations
CREATE POLICY "Admins can manage situations"
  ON service_situations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::uuid
      AND role = 'admin'
    )
  );

-- ============================================
-- RLS POLICIES - CHANNELS
-- ============================================
-- Everyone can read active channels
CREATE POLICY "Everyone can read active channels"
  ON channels FOR SELECT
  USING (is_active = true OR EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()::uuid
    AND role = 'admin'
  ));

-- Only admins can manage channels
CREATE POLICY "Admins can manage channels"
  ON channels FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::uuid
      AND role = 'admin'
    )
  );

-- ============================================
-- RLS POLICIES - NOTES
-- ============================================
-- Users can read their own notes
CREATE POLICY "Users can read own notes"
  ON notes FOR SELECT
  USING (user_id = auth.uid()::uuid);

-- Users can manage their own notes
CREATE POLICY "Users can manage own notes"
  ON notes FOR ALL
  USING (user_id = auth.uid()::uuid);

-- ============================================
-- RLS POLICIES - MESSAGES
-- ============================================
-- Operators can read active messages meant for them
CREATE POLICY "Operators can read their messages"
  ON messages FOR SELECT
  USING (
    is_active = true AND (
      recipients = ARRAY[]::UUID[] OR
      auth.uid()::uuid = ANY(recipients)
    )
  );

-- Admins can manage all messages
CREATE POLICY "Admins can manage messages"
  ON messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::uuid
      AND role = 'admin'
    )
  );

-- Operators can update seen_by
CREATE POLICY "Operators can mark messages as seen"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::uuid
      AND role = 'operator'
    )
  );

-- ============================================
-- RLS POLICIES - QUIZZES
-- ============================================
-- Operators can read active quizzes meant for them
CREATE POLICY "Operators can read their quizzes"
  ON quizzes FOR SELECT
  USING (
    is_active = true AND (
      recipients = ARRAY[]::UUID[] OR
      auth.uid()::uuid = ANY(recipients)
    )
  );

-- Admins can manage all quizzes
CREATE POLICY "Admins can manage quizzes"
  ON quizzes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::uuid
      AND role = 'admin'
    )
  );

-- ============================================
-- RLS POLICIES - QUIZ ATTEMPTS
-- ============================================
-- Operators can read their own attempts
CREATE POLICY "Operators can read own attempts"
  ON quiz_attempts FOR SELECT
  USING (operator_id = auth.uid()::uuid);

-- Operators can insert their own attempts
CREATE POLICY "Operators can insert own attempts"
  ON quiz_attempts FOR INSERT
  WITH CHECK (operator_id = auth.uid()::uuid);

-- Admins can read all attempts
CREATE POLICY "Admins can read all attempts"
  ON quiz_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::uuid
      AND role = 'admin'
    )
  );

-- ============================================
-- RLS POLICIES - CHAT MESSAGES
-- ============================================
-- Users can read messages they sent or received
CREATE POLICY "Users can read their chat messages"
  ON chat_messages FOR SELECT
  USING (
    sender_id = auth.uid()::uuid OR
    recipient_id = auth.uid()::uuid OR
    recipient_id IS NULL
  );

-- Users can send messages
CREATE POLICY "Users can send messages"
  ON chat_messages FOR INSERT
  WITH CHECK (sender_id = auth.uid()::uuid);

-- Users can update messages they received (mark as read)
CREATE POLICY "Users can update received messages"
  ON chat_messages FOR UPDATE
  USING (recipient_id = auth.uid()::uuid OR recipient_id IS NULL);

-- ============================================
-- RLS POLICIES - CHAT SETTINGS
-- ============================================
-- Everyone can read chat settings
CREATE POLICY "Everyone can read chat settings"
  ON chat_settings FOR SELECT
  USING (true);

-- Only admins can manage chat settings
CREATE POLICY "Admins can manage chat settings"
  ON chat_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::uuid
      AND role = 'admin'
    )
  );

-- ============================================
-- RLS POLICIES - PRESENTATIONS
-- ============================================
-- Operators can read active presentations meant for them
CREATE POLICY "Operators can read their presentations"
  ON presentations FOR SELECT
  USING (
    is_active = true AND (
      recipients = ARRAY[]::UUID[] OR
      auth.uid()::uuid = ANY(recipients)
    )
  );

-- Admins can manage all presentations
CREATE POLICY "Admins can manage presentations"
  ON presentations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::uuid
      AND role = 'admin'
    )
  );

-- ============================================
-- RLS POLICIES - PRESENTATION PROGRESS
-- ============================================
-- Operators can read their own progress
CREATE POLICY "Operators can read own progress"
  ON presentation_progress FOR SELECT
  USING (operator_id = auth.uid()::uuid);

-- Operators can manage their own progress
CREATE POLICY "Operators can manage own progress"
  ON presentation_progress FOR ALL
  USING (operator_id = auth.uid()::uuid);

-- Admins can read all progress
CREATE POLICY "Admins can read all progress"
  ON presentation_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::uuid
      AND role = 'admin'
    )
  );

-- ============================================
-- ENABLE REALTIME FOR TABLES
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE script_steps;
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE tabulations;
ALTER PUBLICATION supabase_realtime ADD TABLE service_situations;
ALTER PUBLICATION supabase_realtime ADD TABLE channels;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE quizzes;
ALTER PUBLICATION supabase_realtime ADD TABLE quiz_attempts;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE presentations;
ALTER PUBLICATION supabase_realtime ADD TABLE presentation_progress;

-- ============================================
-- FUNCTIONS FOR AUTOMATIC TIMESTAMPS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_script_steps_updated_at
  BEFORE UPDATE ON script_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_presentations_updated_at
  BEFORE UPDATE ON presentations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_settings_updated_at
  BEFORE UPDATE ON chat_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
