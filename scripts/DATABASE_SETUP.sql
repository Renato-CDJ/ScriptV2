-- ============================================================
-- REPIR - ROTEIRO CALL CENTER
-- SETUP COMPLETO DO BANCO DE DADOS
-- 
-- Copie e cole este script INTEIRO no SQL Editor do Supabase
-- Versao: 3.0 - Consolidado
-- Data: 2024
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. TABELA DE USUARIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  password VARCHAR(255) NOT NULL DEFAULT 'rcp@$',
  role VARCHAR(50) NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator', 'supervisor')),
  admin_type VARCHAR(50) CHECK (admin_type IN ('master', 'monitoria', 'supervisao')),
  allowed_tabs TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_online BOOLEAN DEFAULT false,
  avatar_url TEXT,
  last_activity TIMESTAMPTZ,
  current_product TEXT,
  current_screen TEXT,
  last_script_access TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. TABELA DE PRODUTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT '',
  price NUMERIC DEFAULT 0,
  details JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. TABELA DE ROTEIROS/SCRIPTS
-- ============================================================
CREATE TABLE IF NOT EXISTS scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  category TEXT DEFAULT '',
  product_id TEXT,
  product_name TEXT,
  step_order INTEGER DEFAULT 0,
  buttons JSONB DEFAULT '[]',
  tabulations JSONB DEFAULT '[]',
  alert JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. TABELA DE TABULACOES
-- ============================================================
CREATE TABLE IF NOT EXISTS tabulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  color TEXT DEFAULT '#6b7280',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. TABELA DE SITUACOES
-- ============================================================
CREATE TABLE IF NOT EXISTS situations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  color TEXT DEFAULT '#6b7280',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. TABELA DE CANAIS
-- ============================================================
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT 'phone',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. TABELA DE CODIGOS DE RESULTADO
-- ============================================================
CREATE TABLE IF NOT EXISTS result_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT '',
  color TEXT DEFAULT '#6b7280',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. TABELA DE GUIA INICIAL
-- ============================================================
CREATE TABLE IF NOT EXISTS initial_guide (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  step_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. TABELA DE CONTRATOS
-- ============================================================
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. TABELA DE FRASEOLOGIA
-- ============================================================
CREATE TABLE IF NOT EXISTS phraseology (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  category TEXT DEFAULT '',
  shortcut TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. TABELA DE NOTAS DO OPERADOR
-- ============================================================
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  color TEXT DEFAULT '#fef3c7',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. TABELA DE CONFIGURACOES
-- ============================================================
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 13. TABELA DE MENSAGENS (RECADOS DO ADMIN)
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  priority TEXT DEFAULT 'normal',
  author_id TEXT,
  author_name TEXT,
  recipients TEXT[] DEFAULT '{}',
  send_to_all BOOLEAN DEFAULT true,
  seen_by TEXT[] DEFAULT '{}',
  segments JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 14. TABELA DE QUIZZES
-- ============================================================
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  question TEXT NOT NULL,
  options JSONB DEFAULT '[]',
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  author_id TEXT,
  author_name TEXT,
  recipients TEXT[] DEFAULT '{}',
  send_to_all BOOLEAN DEFAULT true,
  scheduled_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 15. TABELA DE TENTATIVAS DE QUIZ
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  selected_answer TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 16. TABELA DE FEEDBACKS
-- ============================================================
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  content TEXT,
  message TEXT,
  type TEXT DEFAULT 'positive',
  sender_id TEXT,
  sender_name TEXT,
  recipient_id TEXT,
  recipient_name TEXT,
  operator_id UUID,
  operator_name TEXT,
  status TEXT DEFAULT 'pending',
  score INTEGER DEFAULT 0,
  is_read BOOLEAN DEFAULT false,
  created_by UUID,
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 17. TABELA DE POSTS DA CENTRAL DE QUALIDADE
-- ============================================================
CREATE TABLE IF NOT EXISTS quality_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('comunicado', 'quiz', 'recado', 'pergunta', 'feedback', 'aviso', 'procedimento', 'dica')),
  content TEXT NOT NULL,
  author_id TEXT,
  author_name VARCHAR(255) NOT NULL,
  quiz_options JSONB,
  correct_option INTEGER,
  likes TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  recipients TEXT[] DEFAULT '{}',
  recipient_names TEXT[] DEFAULT '{}',
  send_to_all BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 18. TABELA DE COMENTARIOS DA CENTRAL DE QUALIDADE
-- ============================================================
CREATE TABLE IF NOT EXISTS quality_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES quality_posts(id) ON DELETE CASCADE,
  author_id TEXT,
  author_name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 19. TABELA DE PERGUNTAS PARA ADMIN (admin_questions)
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  author_id TEXT NOT NULL,
  author_name TEXT,
  reply TEXT,
  replied_by TEXT,
  replied_by_name TEXT,
  replied_at TIMESTAMPTZ,
  second_reply TEXT,
  second_replied_at TIMESTAMPTZ,
  reply_count INTEGER DEFAULT 0,
  understood BOOLEAN,
  needs_in_person_feedback BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 20. TABELA DE PERGUNTAS DE QUALIDADE (quality_questions)
-- ============================================================
CREATE TABLE IF NOT EXISTS quality_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT,
  author_id TEXT NOT NULL,
  author_name TEXT,
  responder_id TEXT,
  responder_name TEXT,
  status TEXT DEFAULT 'pending',
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 21. TABELA DE MENSAGENS DE CHAT
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,
  recipient_id UUID REFERENCES users(id) ON DELETE SET NULL,
  recipient_name TEXT,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  is_read BOOLEAN DEFAULT false,
  is_global BOOLEAN DEFAULT false,
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 22. TABELA DE CONFIGURACAO DE ATENDIMENTO
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  value JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 23. TABELA DE APRESENTACOES
-- ============================================================
CREATE TABLE IF NOT EXISTS presentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  slides JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 24. TABELA DE OPERADORES (extended info)
-- ============================================================
CREATE TABLE IF NOT EXISTS operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  unidade VARCHAR(100),
  setor VARCHAR(100),
  equipe VARCHAR(100),
  turno VARCHAR(50),
  supervisor VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 25. TABELA DE VISUALIZACOES DE TREINAMENTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS training_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_filename TEXT NOT NULL,
  training_title TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  view_date DATE NOT NULL DEFAULT CURRENT_DATE,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 26. TABELA DE CHAT COM SUPERVISORES
-- ============================================================
CREATE TABLE IF NOT EXISTS supervisor_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  reply_to_id UUID,
  reply_to_sender_name TEXT,
  reply_to_content TEXT,
  attachment_url TEXT,
  attachment_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 27. TABELA DE CHAT COM QUALIDADE
-- ============================================================
CREATE TABLE IF NOT EXISTS quality_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  reply_to_id UUID,
  reply_to_sender_name TEXT,
  reply_to_content TEXT,
  attachment_url TEXT,
  attachment_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ADICIONAR COLUNAS FALTANTES EM TABELAS EXISTENTES
-- (Executa apenas se a coluna nao existir)
-- ============================================================
DO $$
BEGIN
  -- quality_questions.status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_questions' AND column_name = 'status') THEN
    ALTER TABLE quality_questions ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;
  
  -- quality_questions.is_resolved
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_questions' AND column_name = 'is_resolved') THEN
    ALTER TABLE quality_questions ADD COLUMN is_resolved BOOLEAN DEFAULT false;
  END IF;
  
  -- quality_questions.responder_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_questions' AND column_name = 'responder_id') THEN
    ALTER TABLE quality_questions ADD COLUMN responder_id TEXT;
  END IF;
  
  -- quality_questions.responder_name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_questions' AND column_name = 'responder_name') THEN
    ALTER TABLE quality_questions ADD COLUMN responder_name TEXT;
  END IF;
  
  -- feedbacks.status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedbacks' AND column_name = 'status') THEN
    ALTER TABLE feedbacks ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;
  
  -- users.admin_type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'admin_type') THEN
    ALTER TABLE users ADD COLUMN admin_type VARCHAR(50) CHECK (admin_type IN ('master', 'monitoria', 'supervisao'));
  END IF;
  
  -- users.allowed_tabs
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'allowed_tabs') THEN
    ALTER TABLE users ADD COLUMN allowed_tabs TEXT[] DEFAULT '{}';
  END IF;
  
  -- users.last_script_access
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_script_access') THEN
    ALTER TABLE users ADD COLUMN last_script_access TIMESTAMPTZ;
  END IF;
  
  -- users.current_product
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'current_product') THEN
    ALTER TABLE users ADD COLUMN current_product TEXT;
  END IF;
  
  -- users.current_screen
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'current_screen') THEN
    ALTER TABLE users ADD COLUMN current_screen TEXT;
  END IF;
  
  -- admin_questions.second_reply
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_questions' AND column_name = 'second_reply') THEN
    ALTER TABLE admin_questions ADD COLUMN second_reply TEXT;
  END IF;
  
  -- admin_questions.second_replied_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_questions' AND column_name = 'second_replied_at') THEN
    ALTER TABLE admin_questions ADD COLUMN second_replied_at TIMESTAMPTZ;
  END IF;
  
  -- admin_questions.reply_count
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_questions' AND column_name = 'reply_count') THEN
    ALTER TABLE admin_questions ADD COLUMN reply_count INTEGER DEFAULT 0;
  END IF;
  
  -- admin_questions.understood
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_questions' AND column_name = 'understood') THEN
    ALTER TABLE admin_questions ADD COLUMN understood BOOLEAN;
  END IF;
  
  -- admin_questions.needs_in_person_feedback
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_questions' AND column_name = 'needs_in_person_feedback') THEN
    ALTER TABLE admin_questions ADD COLUMN needs_in_person_feedback BOOLEAN DEFAULT false;
  END IF;
  
  -- training_views.view_date
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'training_views' AND column_name = 'view_date') THEN
    ALTER TABLE training_views ADD COLUMN view_date DATE NOT NULL DEFAULT CURRENT_DATE;
  END IF;
  
  -- quality_posts.recipient_names
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_posts' AND column_name = 'recipient_names') THEN
    ALTER TABLE quality_posts ADD COLUMN recipient_names TEXT[] DEFAULT '{}';
  END IF;
  
  -- quality_posts.send_to_all
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_posts' AND column_name = 'send_to_all') THEN
    ALTER TABLE quality_posts ADD COLUMN send_to_all BOOLEAN DEFAULT true;
  END IF;
  
  -- app_settings.description
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'description') THEN
    ALTER TABLE app_settings ADD COLUMN description TEXT;
  END IF;
  
  -- app_settings.updated_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'updated_at') THEN
    ALTER TABLE app_settings ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  
  -- chat_messages.is_edited
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'is_edited') THEN
    ALTER TABLE chat_messages ADD COLUMN is_edited BOOLEAN DEFAULT false;
  END IF;
  
  -- chat_messages.edited_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'edited_at') THEN
    ALTER TABLE chat_messages ADD COLUMN edited_at TIMESTAMPTZ;
  END IF;
  
  -- supervisor_chat_messages columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'supervisor_chat_messages' AND column_name = 'reply_to_id') THEN
    ALTER TABLE supervisor_chat_messages ADD COLUMN reply_to_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'supervisor_chat_messages' AND column_name = 'reply_to_sender_name') THEN
    ALTER TABLE supervisor_chat_messages ADD COLUMN reply_to_sender_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'supervisor_chat_messages' AND column_name = 'reply_to_content') THEN
    ALTER TABLE supervisor_chat_messages ADD COLUMN reply_to_content TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'supervisor_chat_messages' AND column_name = 'attachment_url') THEN
    ALTER TABLE supervisor_chat_messages ADD COLUMN attachment_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'supervisor_chat_messages' AND column_name = 'attachment_name') THEN
    ALTER TABLE supervisor_chat_messages ADD COLUMN attachment_name TEXT;
  END IF;
  
  -- quality_chat_messages columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_chat_messages' AND column_name = 'reply_to_id') THEN
    ALTER TABLE quality_chat_messages ADD COLUMN reply_to_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_chat_messages' AND column_name = 'reply_to_sender_name') THEN
    ALTER TABLE quality_chat_messages ADD COLUMN reply_to_sender_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_chat_messages' AND column_name = 'reply_to_content') THEN
    ALTER TABLE quality_chat_messages ADD COLUMN reply_to_content TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_chat_messages' AND column_name = 'attachment_url') THEN
    ALTER TABLE quality_chat_messages ADD COLUMN attachment_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_chat_messages' AND column_name = 'attachment_name') THEN
    ALTER TABLE quality_chat_messages ADD COLUMN attachment_name TEXT;
  END IF;
  
END $$;

-- ============================================================
-- INDICES PARA PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_last_activity ON users(last_activity);
CREATE INDEX IF NOT EXISTS idx_scripts_product_id ON scripts(product_id);
CREATE INDEX IF NOT EXISTS idx_scripts_is_active ON scripts(is_active);
CREATE INDEX IF NOT EXISTS idx_quality_posts_type ON quality_posts(type);
CREATE INDEX IF NOT EXISTS idx_quality_posts_created ON quality_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quality_posts_recipients ON quality_posts USING GIN (recipients);
CREATE INDEX IF NOT EXISTS idx_quality_posts_send_to_all ON quality_posts(send_to_all);
CREATE INDEX IF NOT EXISTS idx_quality_comments_post ON quality_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_active ON messages(is_active);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quizzes_is_active ON quizzes(is_active);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_at ON quizzes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedbacks_recipient ON feedbacks(recipient_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_initial_guide_step_order ON initial_guide(step_order);
CREATE INDEX IF NOT EXISTS idx_contracts_is_active ON contracts(is_active);
CREATE INDEX IF NOT EXISTS idx_quality_questions_author ON quality_questions(author_id);
CREATE INDEX IF NOT EXISTS idx_quality_questions_status ON quality_questions(status);
CREATE INDEX IF NOT EXISTS idx_admin_questions_author_id ON admin_questions(author_id);
CREATE INDEX IF NOT EXISTS idx_admin_questions_understood ON admin_questions(understood);
CREATE INDEX IF NOT EXISTS idx_training_views_filename ON training_views(training_filename);
CREATE INDEX IF NOT EXISTS idx_training_views_user_id ON training_views(user_id);
CREATE INDEX IF NOT EXISTS idx_training_views_viewed_at ON training_views(viewed_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_training_views_unique_daily ON training_views(training_filename, user_id, view_date);
CREATE INDEX IF NOT EXISTS idx_supervisor_chat_sender ON supervisor_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_chat_recipient ON supervisor_chat_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_chat_created_at ON supervisor_chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_supervisor_chat_reply_to ON supervisor_chat_messages(reply_to_id);
CREATE INDEX IF NOT EXISTS idx_quality_chat_sender ON quality_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_quality_chat_recipient ON quality_chat_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_quality_chat_created_at ON quality_chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_quality_chat_reply_to ON quality_chat_messages(reply_to_id);

-- ============================================================
-- HABILITAR REALTIME
-- ============================================================
DO $$
DECLARE
  tbl TEXT;
  tables_to_add TEXT[] := ARRAY[
    'users', 'products', 'scripts', 'tabulations', 'situations', 
    'channels', 'result_codes', 'initial_guide', 'contracts', 
    'phraseology', 'notes', 'app_settings', 'messages', 'quizzes', 
    'quiz_attempts', 'feedbacks', 'quality_posts', 'quality_comments', 
    'quality_questions', 'admin_questions', 'chat_messages', 
    'attendance_config', 'presentations', 'operators', 'training_views',
    'supervisor_chat_messages', 'quality_chat_messages'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables_to_add
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END LOOP;
END $$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - DESABILITADO PARA TODAS AS TABELAS
-- Isso permite que operadores, supervisores e admins acessem os dados
-- ============================================================

-- Tabelas principais
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE operators DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE scripts DISABLE ROW LEVEL SECURITY;
ALTER TABLE tabulations DISABLE ROW LEVEL SECURITY;
ALTER TABLE situations DISABLE ROW LEVEL SECURITY;
ALTER TABLE channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE result_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE initial_guide DISABLE ROW LEVEL SECURITY;
ALTER TABLE contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE phraseology DISABLE ROW LEVEL SECURITY;
ALTER TABLE notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;

-- Tabelas de comunicacao
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE supervisor_chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE quality_chat_messages DISABLE ROW LEVEL SECURITY;

-- Tabelas de qualidade
ALTER TABLE quality_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE quality_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE quality_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks DISABLE ROW LEVEL SECURITY;

-- Tabelas de quiz e treinamento
ALTER TABLE quizzes DISABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE training_views DISABLE ROW LEVEL SECURITY;
ALTER TABLE presentations DISABLE ROW LEVEL SECURITY;

-- Tabelas adicionais
ALTER TABLE attendance_config DISABLE ROW LEVEL SECURITY;

-- Criar policies permissivas para todas as tabelas (caso RLS seja habilitado depois)
DO $$
DECLARE
  all_tables TEXT[] := ARRAY[
    'users', 'operators', 'products', 'scripts', 'tabulations', 
    'situations', 'channels', 'result_codes', 'initial_guide', 
    'contracts', 'phraseology', 'notes', 'app_settings', 'messages',
    'chat_messages', 'supervisor_chat_messages', 'quality_chat_messages',
    'quality_posts', 'quality_comments', 'quality_questions', 
    'admin_questions', 'feedbacks', 'quizzes', 'quiz_attempts', 
    'training_views', 'presentations', 'attendance_config'
  ];
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY all_tables
  LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS "Enable read access for all users" ON %I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Enable insert for all users" ON %I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Enable update for all users" ON %I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Enable delete for all users" ON %I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Allow read access" ON %I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Allow all operations" ON %I', tbl);
      
      EXECUTE format('CREATE POLICY "Enable read access for all users" ON %I FOR SELECT USING (true)', tbl);
      EXECUTE format('CREATE POLICY "Enable insert for all users" ON %I FOR INSERT WITH CHECK (true)', tbl);
      EXECUTE format('CREATE POLICY "Enable update for all users" ON %I FOR UPDATE USING (true)', tbl);
      EXECUTE format('CREATE POLICY "Enable delete for all users" ON %I FOR DELETE USING (true)', tbl);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;
END $$;

-- ============================================================
-- INSERIR USUARIO ADMIN PADRAO
-- ============================================================
INSERT INTO users (username, name, email, password, role, admin_type, allowed_tabs) 
VALUES ('admin', 'Administrador RC', 'admin@rcp.com', 'rcp@$', 'admin', 'master', '{}')
ON CONFLICT (username) DO NOTHING;

-- Inserir usuarios de Monitoria (10 usuarios)
INSERT INTO users (username, name, email, password, role, admin_type, allowed_tabs)
SELECT 
  'Monitoria' || n,
  'Usuario Monitoria ' || n,
  'monitoria' || n || '@rcp.com',
  'rcp@$',
  'admin',
  'monitoria',
  '{}'
FROM generate_series(1, 10) AS n
ON CONFLICT (username) DO NOTHING;

-- Inserir usuarios de Supervisao (30 usuarios)
INSERT INTO users (username, name, email, password, role, admin_type, allowed_tabs)
SELECT 
  'Supervisor' || n,
  'Usuario Supervisao ' || n,
  'supervisor' || n || '@rcp.com',
  'rcp@$',
  'admin',
  'supervisao',
  ARRAY['dashboard', 'central-qualidade']
FROM generate_series(1, 30) AS n
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- INSERIR DADOS PADRAO
-- ============================================================

-- Tabulacoes padrao
INSERT INTO tabulations (name, description, color) VALUES
('Venda Realizada', 'Cliente fechou a compra', '#22c55e'),
('Callback', 'Cliente solicitou retorno', '#3b82f6'),
('Sem Interesse', 'Cliente nao tem interesse', '#ef4444'),
('Numero Invalido', 'Numero nao existe ou incorreto', '#6b7280'),
('Caixa Postal', 'Caiu na caixa postal', '#f59e0b'),
('Ocupado', 'Linha ocupada', '#8b5cf6')
ON CONFLICT DO NOTHING;

-- Situacoes padrao
INSERT INTO situations (name, description, color) VALUES
('Em Atendimento', 'Operador em ligacao', '#22c55e'),
('Pausado', 'Operador em pausa', '#f59e0b'),
('Disponivel', 'Operador disponivel', '#3b82f6'),
('Ausente', 'Operador ausente', '#ef4444'),
('Treinamento', 'Em treinamento', '#8b5cf6')
ON CONFLICT DO NOTHING;

-- Canais padrao
INSERT INTO channels (name, description, icon) VALUES
('Telefone', 'Atendimento por telefone', 'phone'),
('WhatsApp', 'Atendimento por WhatsApp', 'message-circle'),
('Email', 'Atendimento por email', 'mail'),
('Chat', 'Atendimento por chat online', 'message-square')
ON CONFLICT DO NOTHING;

-- Codigos de resultado padrao
INSERT INTO result_codes (code, name, description, category, color) VALUES
('V01', 'Venda Aprovada', 'Venda realizada e aprovada', 'venda', '#22c55e'),
('V02', 'Venda Pendente', 'Venda aguardando aprovacao', 'venda', '#f59e0b'),
('C01', 'Callback Agendado', 'Retorno agendado com cliente', 'callback', '#3b82f6'),
('N01', 'Nao Atendeu', 'Cliente nao atendeu', 'negativo', '#6b7280'),
('N02', 'Recusou Oferta', 'Cliente recusou a oferta', 'negativo', '#ef4444')
ON CONFLICT DO NOTHING;

-- Guia inicial padrao
INSERT INTO initial_guide (title, content, step_order) VALUES
('Bem-vindo ao Sistema', 'Este e o guia inicial para novos operadores.', 1),
('Login e Acesso', 'Use suas credenciais fornecidas pelo supervisor.', 2),
('Interface Principal', 'Conheca os principais elementos da interface.', 3),
('Realizando Atendimentos', 'Aprenda como realizar e registrar atendimentos.', 4),
('Duvidas Frequentes', 'Consulte esta secao para duvidas comuns.', 5)
ON CONFLICT DO NOTHING;

-- Configuracoes padrao
INSERT INTO app_settings (key, value, description) VALUES
('company_name', '"RCP Call Center"', 'Nome da empresa'),
('working_hours', '{"start": "08:00", "end": "18:00"}', 'Horario de funcionamento'),
('break_duration', '15', 'Duracao da pausa em minutos'),
('theme', '"dark"', 'Tema padrao do sistema')
ON CONFLICT (key) DO NOTHING;

-- Fraseologia padrao
INSERT INTO phraseology (title, content, category, shortcut) VALUES
('Saudacao Inicial', 'Ola, bom dia/tarde! Meu nome e [NOME], em que posso ajudar?', 'abertura', '/oi'),
('Confirmacao de Dados', 'Posso confirmar seus dados? Nome completo e CPF, por favor.', 'dados', '/dados'),
('Aguardar na Linha', 'Por favor, aguarde um momento enquanto verifico as informacoes.', 'espera', '/aguarde'),
('Transferencia', 'Vou transferir sua ligacao para o setor responsavel.', 'transferencia', '/transfer'),
('Encerramento', 'Agradecemos seu contato. Tenha um otimo dia!', 'fechamento', '/tchau')
ON CONFLICT DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- BANCO DE DADOS CONFIGURADO COM SUCESSO!
-- 
-- Total de Tabelas: 27
-- 1. users - Usuarios do sistema
-- 2. products - Produtos/ofertas
-- 3. scripts - Roteiros de atendimento
-- 4. tabulations - Tabulacoes de ligacoes
-- 5. situations - Situacoes do operador
-- 6. channels - Canais de atendimento
-- 7. result_codes - Codigos de resultado
-- 8. initial_guide - Guia inicial
-- 9. contracts - Contratos
-- 10. phraseology - Fraseologia
-- 11. notes - Notas do operador
-- 12. app_settings - Configuracoes
-- 13. messages - Recados/mensagens
-- 14. quizzes - Quizzes
-- 15. quiz_attempts - Tentativas de quiz
-- 16. feedbacks - Feedbacks
-- 17. quality_posts - Posts da central de qualidade
-- 18. quality_comments - Comentarios da central
-- 19. admin_questions - Perguntas para admin
-- 20. quality_questions - Perguntas de qualidade
-- 21. chat_messages - Mensagens de chat geral
-- 22. attendance_config - Config de atendimento
-- 23. presentations - Apresentacoes
-- 24. operators - Info estendida de operadores
-- 25. training_views - Visualizacoes de treinamento
-- 26. supervisor_chat_messages - Chat com supervisores
-- 27. quality_chat_messages - Chat com qualidade
-- ============================================================
