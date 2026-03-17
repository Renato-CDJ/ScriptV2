-- Add new fields to admin_questions for understanding feedback
ALTER TABLE admin_questions ADD COLUMN IF NOT EXISTS understood BOOLEAN DEFAULT NULL;
ALTER TABLE admin_questions ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;
ALTER TABLE admin_questions ADD COLUMN IF NOT EXISTS needs_in_person_feedback BOOLEAN DEFAULT FALSE;
ALTER TABLE admin_questions ADD COLUMN IF NOT EXISTS second_reply TEXT;
ALTER TABLE admin_questions ADD COLUMN IF NOT EXISTS second_replied_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_questions_author_id ON admin_questions(author_id);
CREATE INDEX IF NOT EXISTS idx_admin_questions_understood ON admin_questions(understood);
