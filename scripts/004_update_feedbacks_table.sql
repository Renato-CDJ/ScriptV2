-- ============================================
-- UPDATE FEEDBACKS TABLE FOR ADMIN FEEDBACK FEATURE
-- ============================================

-- Add new columns if they don't exist
ALTER TABLE feedbacks 
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- Update the type check constraint to allow positive/negative
ALTER TABLE feedbacks DROP CONSTRAINT IF EXISTS feedbacks_type_check;
ALTER TABLE feedbacks ADD CONSTRAINT feedbacks_type_check 
  CHECK (type IN ('sugestao', 'problema', 'elogio', 'positive', 'negative'));

-- Realtime is already enabled for feedbacks table
