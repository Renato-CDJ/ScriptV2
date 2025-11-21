-- ============================================
-- PHRASEOLOGIES TABLE
-- ============================================
CREATE TABLE phraseologies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'Geral',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT title_not_empty CHECK (char_length(title) > 0),
  CONSTRAINT content_not_empty CHECK (char_length(content) > 0)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_phraseologies_category ON phraseologies(category);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE phraseologies ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================
-- Everyone can read phraseologies (Admins and Operators)
CREATE POLICY "Everyone can read phraseologies"
  ON phraseologies FOR SELECT
  USING (true);

-- Only admins can manage phraseologies
CREATE POLICY "Admins can manage phraseologies"
  ON phraseologies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::uuid
      AND role = 'admin'
    )
  );

-- ============================================
-- REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE phraseologies;

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_phraseologies_updated_at
  BEFORE UPDATE ON phraseologies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
