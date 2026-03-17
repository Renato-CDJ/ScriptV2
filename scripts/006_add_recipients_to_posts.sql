-- Add recipients columns to quality_posts table
ALTER TABLE quality_posts ADD COLUMN IF NOT EXISTS recipients TEXT[] DEFAULT '{}';
ALTER TABLE quality_posts ADD COLUMN IF NOT EXISTS recipient_names TEXT[] DEFAULT '{}';
ALTER TABLE quality_posts ADD COLUMN IF NOT EXISTS send_to_all BOOLEAN DEFAULT TRUE;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_quality_posts_recipients ON quality_posts USING GIN (recipients);
