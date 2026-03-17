-- Roteiro Call Center - Database Schema
-- Execute este script no SQL Editor do Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- OPERATORS TABLE (extended info)
-- ============================================
CREATE TABLE IF NOT EXISTS operators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  unidade VARCHAR(100),
  setor VARCHAR(100),
  equipe VARCHAR(100),
  turno VARCHAR(50),
  supervisor VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- QUALITY POSTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS quality_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('comunicado', 'quiz', 'recado', 'pergunta', 'feedback')),
  content TEXT NOT NULL,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  author_name VARCHAR(255) NOT NULL,
  quiz_options JSONB,
  likes TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- QUALITY COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS quality_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES quality_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  author_name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ADMIN QUESTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admin_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  author_name VARCHAR(255) NOT NULL,
  reply TEXT,
  replied_by UUID REFERENCES users(id) ON DELETE SET NULL,
  replied_by_name VARCHAR(255),
  replied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- FEEDBACKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('sugestao', 'problema', 'elogio')),
  message TEXT NOT NULL,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  author_name VARCHAR(255) NOT NULL,
  operator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  operator_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PRESENTATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS presentations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  slides JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_quality_posts_type ON quality_posts(type);
CREATE INDEX IF NOT EXISTS idx_quality_posts_created ON quality_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quality_comments_post ON quality_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);

-- ============================================
-- ENABLE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE quality_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE quality_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE admin_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE feedbacks;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access" ON users FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON operators FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON quality_posts FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON quality_comments FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON admin_questions FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON feedbacks FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON presentations FOR SELECT USING (true);

-- Allow all operations (for simplicity - adjust in production)
CREATE POLICY "Allow all operations" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON operators FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON quality_posts FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON quality_comments FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON admin_questions FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON feedbacks FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON presentations FOR ALL USING (true);

-- ============================================
-- INSERT DEFAULT ADMIN USER
-- ============================================
INSERT INTO users (username, name, email, password, role, admin_type, allowed_tabs) 
VALUES ('admin', 'Administrador Master', 'admin@rcp.com', 'rcp@$', 'admin', 'master', '{}')
ON CONFLICT (username) DO NOTHING;

-- Insert default Monitoria users
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

-- Insert default Supervisao users
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
